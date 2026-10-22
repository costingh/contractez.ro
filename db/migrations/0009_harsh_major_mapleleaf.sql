ALTER TYPE "public"."token_type" ADD VALUE IF NOT EXISTS 'email_change';--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN IF NOT EXISTS "secret" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderation_lock" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "collaborations_project_active_uq" ON "collaborations" USING btree ("project_id") WHERE "collaborations"."status" <> 'cancelled';
