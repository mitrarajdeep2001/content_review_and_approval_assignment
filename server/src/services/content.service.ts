import { db } from '../db/index.js';
import { contents, approvalLogs, users, NewContent, subContents } from '../db/schema.js';
import { desc, eq, or, and } from 'drizzle-orm';
import { workflowHelper, ReviewAction } from './workflow.helper.js';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReviewAction =
  | 'CREATED'
  | 'SUBMITTED'
  | 'APPROVED_L1'
  | 'APPROVED_L2'
  | 'APPROVED'
  | 'REJECTED'
  | 'EDITED';

export const contentService = {
  // ─── Fetch All ──────────────────────────────────────────────────────────────
  async fetchAllContents(user?: any) {
    let filter;
    if (user) {
      if (user.role === 'CREATOR') {
        // Creators see their own content + all APPROVED content
        filter = or(eq(contents.createdBy, user.id), eq(contents.status, 'APPROVED'));
      } else if (user.role === 'REVIEWER_L1' || user.role === 'REVIEWER_L2') {
        // Reviewers see all IN_REVIEW + all APPROVED content
        filter = or(eq(contents.status, 'IN_REVIEW'), eq(contents.status, 'APPROVED'));
      }
    }

    const allContents = await db
      .select()
      .from(contents)
      .where(filter)
      .orderBy(desc(contents.createdAt));

    const allLogs = await db
      .select({
        id: approvalLogs.id,
        contentId: approvalLogs.contentId,
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
      .orderBy(approvalLogs.createdAt);

    const allSubContents = await db
      .select({
        sub: subContents,
        creatorName: users.name,
        parentTitle: contents.title,
      })
      .from(subContents)
      .leftJoin(users, eq(subContents.createdBy, users.id))
      .leftJoin(contents, eq(subContents.parentId, contents.id));

    return allContents.map((c) => {
      const history = allLogs
        .filter((log) => log.contentId === c.id)
        .map((log) => ({
          id: log.id,
          action: log.action ?? log.status,
          actor: log.actor || 'System',
          role: log.role || 'SYSTEM',
          timestamp: log.timestamp.toISOString(),
          comment: log.comment,
        }));

      const children = allSubContents
        .filter((row) => row.sub.parentId === c.id)
        .map((row) => ({
          ...row.sub,
          creatorName: row.creatorName,
          parentTitle: row.parentTitle,
          history: allLogs
            .filter((log) => log.subContentId === row.sub.id)
            .map((log) => ({
              id: log.id,
              action: log.action ?? log.status,
              actor: log.actor || 'System',
              role: log.role || 'SYSTEM',
              timestamp: log.timestamp.toISOString(),
              comment: log.comment,
            })),
        }));

      const subContentProgress = {
        total: children.length,
        approved: children.filter((sc) => sc.status === 'APPROVED').length,
      };

      return { ...c, history, subContents: children, subContentProgress };
    });
  },

  // ─── Create ─────────────────────────────────────────────────────────────────
  async createContent(data: NewContent, userId: string) {
    const finalData = {
      ...data,
      currentReviewStage: data.status === 'IN_REVIEW' ? 1 : null,
    };
    const [inserted] = await db.insert(contents).values(finalData).returning();

    const action: ReviewAction = inserted.status === 'IN_REVIEW' ? 'SUBMITTED' : 'CREATED';

    await workflowHelper.logApproval({
      contentId: inserted.id,
      reviewerId: userId,
      status: inserted.status,
      action,
      comment: action === 'SUBMITTED' ? 'Submitted for review' : 'Draft created',
    });

    return inserted;
  },

  // ─── Update ─────────────────────────────────────────────────────────────────
  async updateContent(id: string, data: Partial<NewContent>, userId?: string) {
    const [updated] = await db
      .update(contents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contents.id, id))
      .returning();

    if (userId) {
      await workflowHelper.logApproval({
        contentId: id,
        reviewerId: userId,
        status: updated.status,
        action: 'EDITED',
        comment: 'Content updated',
      });
    }

    return updated;
  },

  // ─── Delete ─────────────────────────────────────────────────────────────────
  async deleteContent(id: string) {
    await db.delete(contents).where(eq(contents.id, id));
  },

  // ─── Submit for Review ───────────────────────────────────────────────────────
  async submitContent(id: string, userId: string) {
    const [item] = await db.select().from(contents).where(eq(contents.id, id));
    if (!item) throw new Error('Content not found');
    if (item.status !== 'DRAFT' && item.status !== 'CHANGES_REQUESTED') {
      throw new Error('Only DRAFT or CHANGES_REQUESTED content can be submitted');
    }

    const [updated] = await db
      .update(contents)
      .set({
        status: 'IN_REVIEW',
        currentReviewStage: 1,
        isLocked: true,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    await workflowHelper.logApproval({
      contentId: id,
      reviewerId: userId,
      status: 'IN_REVIEW',
      action: 'SUBMITTED',
      comment: 'Submitted for review',
      stage: 1,
    });

    return updated;
  },

  // ─── Approve ────────────────────────────────────────────────────────────────
  async approveContent(
    id: string,
    reviewerId: string,
    reviewerRole: string,
    comment?: string
  ) {
    const [item] = await db.select().from(contents).where(eq(contents.id, id));
    if (!item) throw new Error('Content not found');
    if (item.status !== 'IN_REVIEW') {
      throw new Error('Content must be IN_REVIEW to approve');
    }

    workflowHelper.validateStageRole(item.currentReviewStage, reviewerRole);

    const isStage1 = item.currentReviewStage === 1;
    const nextStage = workflowHelper.calculateNextStage(item.currentReviewStage);
    const nextStatus = workflowHelper.calculateNextStatus(nextStage);
    const action: ReviewAction = isStage1 ? 'APPROVED_L1' : 'APPROVED';

    const [updated] = await db
      .update(contents)
      .set({
        status: nextStatus,
        currentReviewStage: nextStage,
        isLocked: nextStatus !== 'APPROVED',
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    await workflowHelper.logApproval({
      contentId: id,
      reviewerId,
      status: nextStatus,
      action,
      comment: comment || null,
      stage: item.currentReviewStage,
    });

    return updated;
  },

  // ─── Reject ─────────────────────────────────────────────────────────────────
  async rejectContent(
    id: string,
    reviewerId: string,
    reviewerRole: string,
    comment?: string
  ) {
    const [item] = await db.select().from(contents).where(eq(contents.id, id));
    if (!item) throw new Error('Content not found');
    if (item.status !== 'IN_REVIEW') {
      throw new Error('Content must be IN_REVIEW to reject');
    }

    workflowHelper.validateStageRole(item.currentReviewStage, reviewerRole);

    const [updated] = await db
      .update(contents)
      .set({
        status: 'CHANGES_REQUESTED',
        currentReviewStage: null,
        isLocked: false,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    await workflowHelper.logApproval({
      contentId: id,
      reviewerId,
      status: 'CHANGES_REQUESTED',
      action: 'REJECTED',
      comment: comment || null,
      stage: item.currentReviewStage,
    });

    return updated;
  },
};
