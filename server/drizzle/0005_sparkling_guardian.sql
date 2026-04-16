CREATE TABLE IF NOT EXISTS "sub_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_content_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"current_review_stage" integer,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_logs" ALTER COLUMN "content_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_logs" ADD COLUMN "sub_content_id" uuid;--> statement-breakpoint
ALTER TABLE "approval_logs" ADD COLUMN "stage" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sub_contents" ADD CONSTRAINT "sub_contents_parent_content_id_contents_id_fk" FOREIGN KEY ("parent_content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sub_contents" ADD CONSTRAINT "sub_contents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_sub_content_id_sub_contents_id_fk" FOREIGN KEY ("sub_content_id") REFERENCES "public"."sub_contents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
