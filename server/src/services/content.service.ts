import { db } from '../db/index.js';
import { contents, approvalLogs, users, NewContent, subContents, readReceipts } from '../db/schema.js';
import { desc, eq, or, and, like, sql, inArray } from 'drizzle-orm';
import { workflowHelper, ReviewAction } from './workflow.helper.js';

// ─── Types ────────────────────────────────────────────────────────────────────


export const contentService = {
  // ─── Fetch All (Paginated) ──────────────────────────────────────────────────
  async fetchAllContents(user: any, options: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    tab?: string;
  } = {}) {
    const { page = 1, limit = 10, search, status, tab } = options;
    const offset = (page - 1) * limit;

    // 1. Build Base access Filter
    let baseFilter;
    if (user.role === 'CREATOR') {
      baseFilter = eq(contents.createdBy, user.id);
    } else if (user.role === 'READER') {
      baseFilter = eq(contents.status, 'APPROVED');
    } else {
      // Reviewers can generally see anything in review or approved
      baseFilter = or(eq(contents.status, 'IN_REVIEW'), eq(contents.status, 'APPROVED'));
    }

    const filters = [baseFilter];

    // 2. Tab-specific filtering for Reviewers
    if (user.role !== 'CREATOR' && tab) {
      const stage = user.role === 'REVIEWER_L1' ? 1 : 2;
      
      if (tab === 'pending') {
        // Pending: either the parent is at my stage, OR at least one sub-content is at my stage
        filters.push(or(
          and(eq(contents.status, 'IN_REVIEW'), eq(contents.currentReviewStage, stage)),
          sql`exists (select 1 from ${subContents} sc where sc.parent_content_id = ${contents.id} and sc.status = 'IN_REVIEW' and sc.current_review_stage = ${stage})`
        ));
      } else if (tab === 'recent') {
        const reviewActions = ['APPROVED_L1', 'APPROVED_L2', 'APPROVED', 'REJECTED'];
        // Recent: current user has a record in approval_logs for either parent or any sub-content
        filters.push(sql`exists (
          select 1 from ${approvalLogs} al 
          where al.reviewer_id = ${user.id} 
          and al.action in ${reviewActions}
          and (al.content_id = ${contents.id} or al.sub_content_id in (select id from ${subContents} sc where sc.parent_content_id = ${contents.id}))
        )`);
      }
    }

    if (status && status !== 'ALL') {
      if (status === 'READ') {
        filters.push(sql`(select count(*) from ${readReceipts} rr where rr.content_id = ${contents.id} and rr.user_id = ${user.id}) > 0`);
      } else if (status === 'UNREAD') {
        filters.push(sql`(select count(*) from ${readReceipts} rr where rr.content_id = ${contents.id} and rr.user_id = ${user.id}) = 0`);
      } else {
        filters.push(eq(contents.status, status as any));
      }
    }
    if (search) {
      const cleanSearch = search
        .replace(/[()!:&|]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => `${word.startsWith('-') ? word.substring(1) : word}:*`)
        .join(' & ');
        
      if (cleanSearch) {
        filters.push(
          sql`to_tsvector('simple', coalesce(${contents.title}, '') || ' ' || coalesce(${contents.description}, '')) @@ to_tsquery('simple', ${cleanSearch})`
        );
      }
    }

    const finalFilter = and(...filters);

    // Order by latest review if in recent tab, otherwise by creation
    let orderBy = desc(contents.createdAt);
    if (tab === 'recent') {
      orderBy = sql`(
        select max(al.created_at) from ${approvalLogs} al 
        where al.reviewer_id = ${user.id} 
        and (al.content_id = ${contents.id} or al.sub_content_id in (select id from ${subContents} sc where sc.parent_content_id = ${contents.id}))
      ) desc` as any;
    }

    // 2. Get Count and Paginated Items
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(contents).where(finalFilter);
    const total = Number(countResult?.count || 0);

    const pageContents = await db
      .select({
        content: contents,
        creatorName: users.name,
      })
      .from(contents)
      .leftJoin(users, eq(contents.createdBy, users.id))
      .where(finalFilter)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    if (pageContents.length === 0) {
      return { items: [], total, page, limit, hasMore: false, stats: await this.getStats(user) };
    }

    const contentIds = pageContents.map((row) => row.content.id);

    // 3. Fetch Sub-resources ONLY for target items
    const subContentFilters: any[] = [inArray(subContents.parentId, contentIds)];
    if (user.role === 'READER') {
      subContentFilters.push(eq(subContents.status, 'APPROVED'));
    }

    const pSubContents = db
      .select({
        sub: subContents,
        creatorName: users.name,
        parentTitle: contents.title,
      })
      .from(subContents)
      .leftJoin(users, eq(subContents.createdBy, users.id))
      .leftJoin(contents, eq(subContents.parentId, contents.id))
      .where(and(...subContentFilters));

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
    const items = pageContents.map((row) => {
      const c = row.content;
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
        .filter((r) => r.sub.parentId === c.id)
        .map((r) => ({
          ...r.sub,
          creatorName: r.creatorName,
          parentTitle: r.parentTitle,
          history: allLogs
            .filter((log) => log.subContentId === r.sub.id)
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

      return { ...c, creatorName: row.creatorName, history, subContents: children, subContentProgress };
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
    } else if (user.role === 'READER') {
      const [counts] = await db
        .select({
          total: sql<number>`count(distinct ${contents.id})`,
          read: sql<number>`count(distinct case when ${readReceipts.id} is not null then ${contents.id} else null end)`,
        })
        .from(contents)
        .leftJoin(readReceipts, and(eq(readReceipts.contentId, contents.id), eq(readReceipts.userId, user.id)))
        .where(eq(contents.status, 'APPROVED'));

      return {
        total: Number(counts?.total || 0),
        drafts: 0,
        inReview: 0,
        approved: Number(counts?.total || 0),
        needsAction: 0,
        read: Number(counts?.read || 0),
        unread: Number(counts?.total || 0) - Number(counts?.read || 0),
      };
    } else {
      const isL1 = user.role === 'REVIEWER_L1';
      const stage = isL1 ? 1 : 2;

      // Pending: parent contents at my stage
      const [pendingParents] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contents)
        .where(and(eq(contents.status, 'IN_REVIEW'), eq(contents.currentReviewStage, stage)));

      // Pending: sub-contents at my stage
      const [pendingSubs] = await db
        .select({ count: sql<number>`count(*)` })
        .from(subContents)
        .where(and(eq(subContents.status, 'IN_REVIEW'), eq(subContents.currentReviewStage, stage)));

      // Approved by me: count separately for parent contents (content_id not null) 
      // and sub-contents (sub_content_id not null, content_id null)
      const [approvedParents] = await db
        .select({ count: sql<number>`count(distinct content_id)` })
        .from(approvalLogs)
        .where(
          and(
            eq(approvalLogs.reviewerId, user.id),
            sql`action in ('APPROVED_L1', 'APPROVED_L2', 'APPROVED')`,
            sql`content_id is not null`
          )
        );

      const [approvedSubs] = await db
        .select({ count: sql<number>`count(distinct sub_content_id)` })
        .from(approvalLogs)
        .where(
          and(
            eq(approvalLogs.reviewerId, user.id),
            sql`action in ('APPROVED_L1', 'APPROVED_L2', 'APPROVED')`,
            sql`sub_content_id is not null`
          )
        );

      // Rejected by me: same split
      const [rejectedParents] = await db
        .select({ count: sql<number>`count(distinct content_id)` })
        .from(approvalLogs)
        .where(
          and(
            eq(approvalLogs.reviewerId, user.id),
            sql`action = 'REJECTED'`,
            sql`content_id is not null`
          )
        );

      const [rejectedSubs] = await db
        .select({ count: sql<number>`count(distinct sub_content_id)` })
        .from(approvalLogs)
        .where(
          and(
            eq(approvalLogs.reviewerId, user.id),
            sql`action = 'REJECTED'`,
            sql`sub_content_id is not null`
          )
        );

      return {
        pendingCount: Number(pendingParents?.count || 0) + Number(pendingSubs?.count || 0),
        approvedByMeCount: Number(approvedParents?.count || 0) + Number(approvedSubs?.count || 0),
        rejectedByMeCount: Number(rejectedParents?.count || 0) + Number(rejectedSubs?.count || 0),
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
  // ─── Mark as Read ────────────────────────────────────────────────────────
  async markAsRead(userId: string, contentIdOrSubId: string, isSubContent: boolean) {
    if (isSubContent) {
      await db.insert(readReceipts).values({
        userId,
        subContentId: contentIdOrSubId,
      }).onConflictDoNothing();
    } else {
      await db.insert(readReceipts).values({
        userId,
        contentId: contentIdOrSubId,
      }).onConflictDoNothing();
    }
  },
};
