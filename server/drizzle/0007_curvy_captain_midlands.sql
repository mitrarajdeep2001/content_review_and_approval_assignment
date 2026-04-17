CREATE INDEX IF NOT EXISTS "approval_logs_content_idx" ON "approval_logs" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approval_logs_sub_content_idx" ON "approval_logs" USING btree ("sub_content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contents_status_idx" ON "contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contents_created_by_idx" ON "contents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contents_search_idx" ON "contents" USING gin (to_tsvector('english', "title" || ' ' || "description"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_contents_status_idx" ON "sub_contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_contents_created_by_idx" ON "sub_contents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_contents_parent_idx" ON "sub_contents" USING btree ("parent_content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_contents_search_idx" ON "sub_contents" USING gin (to_tsvector('english', "title" || ' ' || "description"));