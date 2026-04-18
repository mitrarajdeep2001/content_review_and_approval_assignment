CREATE TABLE IF NOT EXISTS "read_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" uuid,
	"sub_content_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "read_receipts" ADD CONSTRAINT "read_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "read_receipts" ADD CONSTRAINT "read_receipts_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "read_receipts" ADD CONSTRAINT "read_receipts_sub_content_id_sub_contents_id_fk" FOREIGN KEY ("sub_content_id") REFERENCES "public"."sub_contents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "read_receipts_user_content_idx" ON "read_receipts" USING btree ("user_id","content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "read_receipts_user_sub_content_idx" ON "read_receipts" USING btree ("user_id","sub_content_id");