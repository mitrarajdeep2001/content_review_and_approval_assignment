import { db } from '../db/index.js';
import { subContents, contents, users, approvalLogs, NewSubContent } from '../db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import { workflowHelper, ReviewAction } from './workflow.helper.js';

export const subContentService = {
  // ─── Fetch by Parent ────────────────────────────────────────────────────────
  async getSubContentsByParent(parentId: string, user?: any) {
    let filter = eq(subContents.parentId, parentId);
    
    if (user) {
      if (user.role === 'CREATOR') {
        // Creators see their own sub-content + all APPROVED sub-content
        filter = and(
          eq(subContents.parentId, parentId), 
          or(eq(subContents.createdBy, user.id), eq(subContents.status, 'APPROVED'))
        ) as any;
      } else if (user.role === 'REVIEWER_L1' || user.role === 'REVIEWER_L2') {
        // Reviewers see all IN_REVIEW + all APPROVED sub-content
        filter = and(
          eq(subContents.parentId, parentId), 
          or(eq(subContents.status, 'IN_REVIEW'), eq(subContents.status, 'APPROVED'))
        ) as any;
      }
    }

    const list = await db.select().from(subContents).where(filter);
    
    // Enrich with history
    const enriched = await Promise.all(list.map(async (item) => {
      const logs = await db
        .select({
          id: approvalLogs.id,
          status: approvalLogs.status,
          action: approvalLogs.action,
          actor: users.name,
          role: users.role,
          timestamp: approvalLogs.createdAt,
          comment: approvalLogs.comment,
        })
        .from(approvalLogs)
        .leftJoin(users, eq(approvalLogs.reviewerId, users.id))
        .where(eq(approvalLogs.subContentId, item.id))
        .orderBy(approvalLogs.createdAt);

      return {
        ...item,
        history: logs.map(l => ({
          ...l,
          timestamp: l.timestamp.toISOString(),
          action: l.action || l.status,
          actor: l.actor || 'System',
          role: l.role || 'SYSTEM'
        }))
      };
    }));

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

    const [updated] = await db
      .update(subContents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subContents.id, id))
      .returning();

    await workflowHelper.logApproval({
      subContentId: id,
      reviewerId: userId,
      status: updated.status,
      action: 'EDITED',
      comment: 'Sub-content updated',
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
