import { db } from '../db/index.js';
import { contents, approvalLogs, users, NewContent, subContents } from '../db/schema.js';
import { desc, eq, or, and, like, sql, inArray } from 'drizzle-orm';
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
  // ─── Fetch All (Paginated) ──────────────────────────────────────────────────
  async fetchAllContents(user: any, options: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
  } = {}) {
    const { page = 1, limit = 10, search, status } = options;
    const offset = (page - 1) * limit;

    // 1. Build Page Filter
    let baseFilter;
    if (user.role === 'CREATOR') {
      baseFilter = or(eq(contents.createdBy, user.id), eq(contents.status, 'APPROVED'));
    } else {
      baseFilter = or(eq(contents.status, 'IN_REVIEW'), eq(contents.status, 'APPROVED'));
    }

    const filters = [baseFilter];
    if (status && status !== 'ALL') {
      filters.push(eq(contents.status, status as any));
    }
    if (search) {
      filters.push(or(
        like(contents.title, `%${search}%`),
        like(contents.description, `%${search}%`)
      ));
    }

    const finalFilter = and(...filters);

    // 2. Get Count and Paginated Items
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(contents).where(finalFilter);
    const total = Number(countResult?.count || 0);

    const pageContents = await db
      .select()
      .from(contents)
      .where(finalFilter)
      .orderBy(desc(contents.createdAt))
      .limit(limit)
      .offset(offset);

    if (pageContents.length === 0) {
      return { items: [], total, page, limit, hasMore: false, stats: await this.getStats(user) };
    }

    const contentIds = pageContents.map((c) => c.id);

    // 3. Fetch Sub-resources ONLY for target items
    const pSubContents = db
      .select({
        sub: subContents,
        creatorName: users.name,
        parentTitle: contents.title,
      })
      .from(subContents)
      .leftJoin(users, eq(subContents.createdBy, users.id))
      .leftJoin(contents, eq(subContents.parentId, contents.id))
      .where(inArray(subContents.parentId, contentIds));

    const pLogs = db
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
      .where(
        or(
          inArray(approvalLogs.contentId, contentIds),
          inArray(approvalLogs.subContentId, db.select({ id: subContents.id }).from(subContents).where(inArray(subContents.parentId, contentIds)))
        )
      )
      .orderBy(approvalLogs.createdAt);

    const [allSubContents, allLogs] = await Promise.all([pSubContents, pLogs]);

    // 4. Transform data
    const items = pageContents.map((c) => {
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

    const stats = await this.getStats(user);

    return {
      items,
      total,
      page,
      limit,
      hasMore: total > offset + pageContents.length,
      stats,
    };
  },

  async getStats(user: any) {
    if (user.role === 'CREATOR') {
      const [counts] = await db
        .select({
          total: sql<number>`count(*)`,
          drafts: sql<number>`count(*) filter (where status = 'DRAFT')`,
          inReview: sql<number>`count(*) filter (where status = 'IN_REVIEW')`,
          approved: sql<number>`count(*) filter (where status = 'APPROVED')`,
          needsAction: sql<number>`count(*) filter (where status = 'CHANGES_REQUESTED')`,
        })
        .from(contents)
        .where(eq(contents.createdBy, user.id));
      return counts;
    } else {
      // Reviewer stats (simplified for now, can be expanded)
      const isL1 = user.role === 'REVIEWER_L1';
      const stage = isL1 ? 1 : 2;

      const [pendingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contents)
        .where(and(eq(contents.status, 'IN_REVIEW'), eq(contents.currentReviewStage, stage)));

      const [reviewedByMe] = await db
        .select({
          approved: sql<number>`count(distinct content_id) filter (where action in ('APPROVED_L1', 'APPROVED_L2', 'APPROVED'))`,
          rejected: sql<number>`count(distinct content_id) filter (where action = 'REJECTED')`,
        })
        .from(approvalLogs)
        .where(eq(approvalLogs.reviewerId, user.id));

      return {
        pendingCount: Number(pendingCount?.count || 0),
        approvedByMeCount: Number(reviewedByMe?.approved || 0),
        rejectedByMeCount: Number(reviewedByMe?.rejected || 0),
      };
    }
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
