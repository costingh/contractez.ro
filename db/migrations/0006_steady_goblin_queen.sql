CREATE TYPE "public"."outreach_kind" AS ENUM('post', 'comment');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('new', 'scored', 'irrelevant', 'contacted', 'skipped', 'already_contacted', 'replied', 'signed_up');--> statement-breakpoint
CREATE TYPE "public"."outreach_type" AS ENUM('client', 'provider', 'irrelevant');--> statement-breakpoint
CREATE TABLE "outreach_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fb_item_id" text NOT NULL,
	"kind" "outreach_kind" NOT NULL,
	"parent_post_id" text,
	"group_id" text NOT NULL,
	"group_name" text,
	"author_name" text,
	"author_profile_url" text,
	"author_fb_id" text,
	"person_key" text,
	"text" text DEFAULT '' NOT NULL,
	"permalink" text,
	"posted_at_text" text,
	"comment_count" integer,
	"status" "outreach_status" DEFAULT 'new' NOT NULL,
	"type" "outreach_type",
	"category_id" integer,
	"locality" text,
	"score" integer,
	"reason" text,
	"message" text,
	"contacted_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outreach_leads" ADD CONSTRAINT "outreach_leads_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "outreach_leads_fb_item_uq" ON "outreach_leads" USING btree ("fb_item_id");--> statement-breakpoint
CREATE INDEX "outreach_leads_person_idx" ON "outreach_leads" USING btree ("person_key");--> statement-breakpoint
CREATE INDEX "outreach_leads_status_score_idx" ON "outreach_leads" USING btree ("status","score");--> statement-breakpoint
CREATE INDEX "outreach_leads_contacted_idx" ON "outreach_leads" USING btree ("contacted_at");