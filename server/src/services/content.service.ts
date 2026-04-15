import { db } from '../db/index.js';
import { contents, NewContent } from '../db/schema.js';
import { desc } from 'drizzle-orm';

export const contentService = {
  async fetchAllContents() {
    return await db.select().from(contents).orderBy(desc(contents.createdAt));
  },
  
  async createContent(data: NewContent) {
    const [inserted] = await db.insert(contents).values(data).returning();
    return inserted;
  }
};
