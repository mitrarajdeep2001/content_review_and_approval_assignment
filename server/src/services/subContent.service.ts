import { db } from '../db/index.js';
import { subContents, contents, users, approvalLogs, NewSubContent } from '../db/schema.js';
import { eq, and, or, inArray } from 'drizzle-orm';
import { workflowHelper, ReviewAction } from './workflow.helper.js';

export const subContentService = {
  // ─── Fetch by Parent ────────────────────────────────────────────────────────
  async getSubContentsByParent(parentId: string, user?: any) {
    let filter = eq(subContents.parentId, parentId);
    
    if (user) {
      if (user.role === 'CREATOR') {
        // Creators see their own sub-content
        filter = and(
          eq(subContents.parentId, parentId), 
          eq(subContents.createdBy, user.id)
        ) as any;
      } else if (user.role === 'REVIEWER_L1' || user.role === 'REVIEWER_L2') {
        // Reviewers see all IN_REVIEW + all APPROVED sub-content
        const stage = user.role === 'REVIEWER_L1' ? 1 : 2;
        filter = and(
          eq(subContents.parentId, parentId), 
          or(
            and(
              eq(subContents.status, 'IN_REVIEW'),
              eq(subContents.currentReviewStage, stage)
            ),
            eq(subContents.status, 'APPROVED')
          )
        ) as any;
      } else if (user.role === 'READER') {
        // Readers ONLY see APPROVED sub-content
        filter = and(
          eq(subContents.parentId, parentId),
          eq(subContents.status, 'APPROVED')
        ) as any;
      }
    }

    const list = await db.select().from(subContents).where(filter);
    
    if (list.length === 0) return [];

    const subContentIds = list.map(item => item.id);

    const allLogs = await db
      .select({
        id: approvalLogs.id,
        subContentId: approvalLogs.subContentId,
        status: approvalLogs.status,
        action: approvalLogs.action,
        actor: users.name,
        role: users.role,
        timestamp: approvalLogs.createdAt,
        comment: approvalLogs.comment,
      })
      .from(approvalLogs)
      .leftJoin(users, eq(approvalLogs.reviewerId, users.id))
      .where(inArray(approvalLogs.subContentId, subContentIds))
      .orderBy(approvalLogs.createdAt);

    // Enrich with history
    const enriched = list.map((item) => {
      const logs = allLogs.filter((log) => log.subContentId === item.id);
      return {
        ...item,
        history: logs.map(l => ({
          id: l.id,
          status: l.status,
          comment: l.comment,
          timestamp: l.timestamp.toISOString(),
          action: l.action || l.status,
          actor: l.actor || 'System',
          role: l.role || 'SYSTEM'
        }))
      };
    });

    return enriched;
  },

  // ─── Create ─────────────────────────────────────────────────────────────────
  async createSubContent(parentId: string, data: any, userId: string) {
    const [parent] = await db.select().from(contents).where(eq(contents.id, parentId));
    if (!parent) throw new Error('Parent content not found');
    if (parent.status !== 'APPROVED') throw new Error('Cannot add sub-content unless parent is APPROVED');

    const status = data.status || 'DRAFT';
    const isSubmitted = status === 'IN_REVIEW';

    const [inserted] = await db.insert(subContents).values({
      ...data,
      parentId,
      createdBy: userId,
      status,
      currentReviewStage: isSubmitted ? 1 : null,
      isLocked: isSubmitted,
    }).returning();

    await workflowHelper.logApproval({
      subContentId: inserted.id,
      reviewerId: userId,
      status,
      action: isSubmitted ? 'SUBMITTED' : 'CREATED',
      comment: isSubmitted ? 'Created and submitted for review' : 'Sub-content created',
      stage: isSubmitted ? 1 : null,
    });

    return inserted;
  },

  // ─── Update ─────────────────────────────────────────────────────────────────
  async updateSubContent(id: string, data: Partial<NewSubContent>, userId: string) {
    const [item] = await db.select().from(subContents).where(eq(subContents.id, id));
    if (!item) throw new Error('Sub-content not found');
    if (item.isLocked) throw new Error('Sub-content is locked and cannot be edited');

    // Prepare update payload
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // If moving to IN_REVIEW, initialize stage and lock it
    if (data.status === 'IN_REVIEW') {
      updateData.currentReviewStage = 1;
      updateData.isLocked = true;
    }

    const [updated] = await db
      .update(subContents)
      .set(updateData)
      .where(eq(subContents.id, id))
      .returning();

    await workflowHelper.logApproval({
      subContentId: id,
      reviewerId: userId,
      status: updated.status,
      action: data.status === 'IN_REVIEW' ? 'SUBMITTED' : 'EDITED',
      comment: data.status === 'IN_REVIEW' ? 'Resubmitted for review' : 'Sub-content updated',
      stage: updated.currentReviewStage
    });

    return updated;
  },

  // ─── Delete ─────────────────────────────────────────────────────────────────
  async deleteSubContent(id: string) {
    const [item] = await db.select().from(subContents).where(eq(subContents.id, id));
    if (!item) throw new Error('Sub-content not found');

    if (item.status !== 'DRAFT') throw new Error('Sub-content can only be deleted in DRAFT status');

    await db.delete(subContents).where(eq(subContents.id, id));
  },

  // ─── Submit ─────────────────────────────────────────────────────────────────
  async submitSubContent(id: string, userId: string) {
    const [item] = await db.select().from(subContents).where(eq(subContents.id, id));
    if (!item) throw new Error('Sub-content not found');
    if (item.status !== 'DRAFT' && item.status !== 'CHANGES_REQUESTED') {
      throw new Error('Only DRAFT or CHANGES_REQUESTED sub-content can be submitted');
    }

    const [parent] = await db.select().from(contents).where(eq(contents.id, item.parentId));
    if (!parent || parent.status !== 'APPROVED') {
      throw new Error('Sub-content can only be submitted if parent is APPROVED');
    }

    const [updated] = await db
      .update(subContents)
      .set({
        status: 'IN_REVIEW',
        currentReviewStage: 1,
        isLocked: true,
        updatedAt: new Date(),
      })
      .where(eq(subContents.id, id))
      .returning();

    await workflowHelper.logApproval({
      subContentId: id,
      reviewerId: userId,
      status: 'IN_REVIEW',
      action: 'SUBMITTED',
      comment: 'Submitted for review',
      stage: 1,
    });

    return updated;
  },

  // ─── Approve ────────────────────────────────────────────────────────────────
  async approveSubContent(id: string, reviewerId: string, reviewerRole: string, comment?: string) {
    const [item] = await db.select().from(subContents).where(eq(subContents.id, id));
    if (!item) throw new Error('Sub-content not found');
    if (item.status !== 'IN_REVIEW') throw new Error('Sub-content must be IN_REVIEW to approve');

    workflowHelper.validateStageRole(item.currentReviewStage, reviewerRole);

    const nextStage = workflowHelper.calculateNextStage(item.currentReviewStage);
    const nextStatus = workflowHelper.calculateNextStatus(nextStage);
    const action: ReviewAction = item.currentReviewStage === 1 ? 'APPROVED_L1' : 'APPROVED';

    const [updated] = await db
      .update(subContents)
      .set({
        status: nextStatus,
        currentReviewStage: nextStage,
        isLocked: nextStatus !== 'APPROVED', // Still locked if moving to next review stage
        updatedAt: new Date(),
      })
      .where(eq(subContents.id, id))
      .returning();

    await workflowHelper.logApproval({
      subContentId: id,
      reviewerId,
      status: nextStatus,
      action,
      comment: comment || null,
      stage: item.currentReviewStage,
    });

    return updated;
  },

  // ─── Reject ─────────────────────────────────────────────────────────────────
  async rejectSubContent(id: string, reviewerId: string, reviewerRole: string, comment?: string) {
    const [item] = await db.select().from(subContents).where(eq(subContents.id, id));
    if (!item) throw new Error('Sub-content not found');
    if (item.status !== 'IN_REVIEW') throw new Error('Sub-content must be IN_REVIEW to reject');

    workflowHelper.validateStageRole(item.currentReviewStage, reviewerRole);

    const [updated] = await db
      .update(subContents)
      .set({
        status: 'CHANGES_REQUESTED',
        currentReviewStage: null,
        isLocked: false,
        updatedAt: new Date(),
      })
      .where(eq(subContents.id, id))
      .returning();

    await workflowHelper.logApproval({
      subContentId: id,
      reviewerId,
      status: 'CHANGES_REQUESTED',
      action: 'REJECTED',
      comment: comment || null,
      stage: item.currentReviewStage,
    });

    return updated;
  },
};
