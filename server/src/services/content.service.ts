import { db } from '../db/index.js';
import { contents, approvalLogs, users, NewContent } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

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
  async fetchAllContents() {
    const allContents = await db
      .select()
      .from(contents)
      .orderBy(desc(contents.createdAt));

    const allLogs = await db
      .select({
        id: approvalLogs.id,
        contentId: approvalLogs.contentId,
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

    return allContents.map((c) => {
      const history = allLogs
        .filter((log) => log.contentId === c.id)
        .map((log) => ({
          id: log.id,
          // Use the richer action label when present, fall back to status
          action: log.action ?? log.status,
          actor: log.actor || 'System',
          role: log.role || 'SYSTEM',
          timestamp: log.timestamp.toISOString(),
          comment: log.comment,
        }));
      return { ...c, history };
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

    await db.insert(approvalLogs).values({
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
      await db.insert(approvalLogs).values({
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

    await db.insert(approvalLogs).values({
      contentId: id,
      reviewerId: userId,
      status: 'IN_REVIEW',
      action: 'SUBMITTED',
      comment: 'Submitted for review',
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

    // Stage & role enforcement
    if (item.currentReviewStage === 1 && reviewerRole !== 'REVIEWER_L1') {
      throw new Error('Only REVIEWER_L1 can approve Stage 1 content');
    }
    if (item.currentReviewStage === 2 && reviewerRole !== 'REVIEWER_L2') {
      throw new Error('Only REVIEWER_L2 can approve Stage 2 content');
    }

    const isStage1 = item.currentReviewStage === 1;
    const nextStage = isStage1 ? 2 : null;
    const nextStatus = isStage1 ? 'IN_REVIEW' : 'APPROVED';
    const action: ReviewAction = isStage1 ? 'APPROVED_L1' : 'APPROVED';

    const [updated] = await db
      .update(contents)
      .set({
        status: nextStatus as any,
        currentReviewStage: nextStage,
        isLocked: nextStatus !== 'APPROVED',
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    await db.insert(approvalLogs).values({
      contentId: id,
      reviewerId,
      status: nextStatus as any,
      action,
      comment: comment || null,
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

    // Both L1 and L2 can reject from their respective stage
    if (item.currentReviewStage === 1 && reviewerRole !== 'REVIEWER_L1') {
      throw new Error('Only REVIEWER_L1 can reject Stage 1 content');
    }
    if (item.currentReviewStage === 2 && reviewerRole !== 'REVIEWER_L2') {
      throw new Error('Only REVIEWER_L2 can reject Stage 2 content');
    }

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

    await db.insert(approvalLogs).values({
      contentId: id,
      reviewerId,
      status: 'CHANGES_REQUESTED',
      action: 'REJECTED',
      comment: comment || null,
    });

    return updated;
  },
};
