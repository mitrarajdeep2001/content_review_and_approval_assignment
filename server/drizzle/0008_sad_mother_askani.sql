DROP INDEX IF EXISTS "contents_search_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sub_contents_search_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contents_search_idx" ON "contents" USING gin (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", '')));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_contents_search_idx" ON "sub_contents" USING gin (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", '')));