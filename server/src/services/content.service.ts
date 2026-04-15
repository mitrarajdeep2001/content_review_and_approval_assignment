import { db } from '../db/index.js';
import { contents, approvalLogs, users, NewContent } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

export const contentService = {
  async fetchAllContents() {
    const allContents = await db.select().from(contents).orderBy(desc(contents.createdAt));
    const allLogs = await db.select({
      id: approvalLogs.id,
      contentId: approvalLogs.contentId,
      action: approvalLogs.status,
      actor: users.name,
      role: users.role,
      timestamp: approvalLogs.createdAt,
      comment: approvalLogs.comment
    }).from(approvalLogs).leftJoin(users, eq(approvalLogs.reviewerId, users.id)).orderBy(approvalLogs.createdAt);

    return allContents.map(c => {
      // Map to frontend interface: action matches status since we simplified
      const history = allLogs.filter(log => log.contentId === c.id).map(log => ({
        id: log.id,
        action: log.action,
        actor: log.actor || 'System',
        role: log.role || 'SYSTEM',
        timestamp: log.timestamp.toISOString(),
        comment: log.comment
      }));
      return { ...c, history };
    });
  },
  
  async createContent(data: NewContent, userId: string) {
    const [inserted] = await db.insert(contents).values(data).returning();
    
    await db.insert(approvalLogs).values({
      contentId: inserted.id,
      reviewerId: userId,
      status: inserted.status,
      comment: inserted.status === 'IN_REVIEW' ? 'Submitted for review' : 'Draft created'
    });
    
    return inserted;
  }
};
