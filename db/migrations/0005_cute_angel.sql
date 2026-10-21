ALTER TABLE "provider_profiles" ADD COLUMN "social_links" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "cover_path" text;