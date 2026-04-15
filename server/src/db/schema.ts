import { pgTable, text, timestamp, uuid, pgEnum, integer, boolean } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['CREATOR', 'REVIEWER_L1', 'REVIEWER_L2']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const contentStatusEnum = pgEnum('content_status', ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED']);

export const contents = pgTable('contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  body: text('body').notNull(),
  image: text('image'),
  status: contentStatusEnum('status').default('DRAFT').notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;

export const approvalLogs = pgTable('approval_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').references(() => contents.id, { onDelete: 'cascade' }).notNull(),
  reviewerId: uuid('reviewer_id').references(() => users.id).notNull(),
  status: contentStatusEnum('status').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ApprovalLog = typeof approvalLogs.$inferSelect;
export type NewApprovalLog = typeof approvalLogs.$inferInsert;
