CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('submitted', 'viewed', 'shortlisted', 'rejected', 'hired', 'withdrawn', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."auto_bid_execution_status" AS ENUM('proposed', 'applied', 'skipped', 'declined', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."auto_bid_mode" AS ENUM('review', 'automatic');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('available', 'busy', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."boost_type" AS ENUM('profile', 'application', 'featured');--> statement-breakpoint
CREATE TYPE "public"."budget_type" AS ENUM('fixed', 'hourly', 'monthly', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."collaboration_status" AS ENUM('pending_confirmation', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."credit_bucket" AS ENUM('promo', 'paid');--> statement-breakpoint
CREATE TYPE "public"."credit_reason" AS ENUM('welcome', 'purchase', 'application', 'refund', 'admin_adjustment', 'promo_grant', 'boost', 'purchase_reversal', 'expiry');--> statement-breakpoint
CREATE TYPE "public"."digest_frequency" AS ENUM('instant', 'daily', 'weekly', 'off');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('queued', 'sent', 'logged', 'failed');--> statement-breakpoint
CREATE TYPE "public"."invoice_requirement" AS ENUM('required', 'preferred', 'not_needed');--> statement-breakpoint
CREATE TYPE "public"."legal_entity_type" AS ENUM('none', 'pfa', 'ii', 'srl', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('fixed', 'hourly', 'monthly', 'to_discuss');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('hour', 'project', 'day', 'sqm', 'unit', 'month');--> statement-breakpoint
CREATE TYPE "public"."pricing_model" AS ENUM('hourly', 'fixed', 'quote');--> statement-breakpoint
CREATE TYPE "public"."project_source" AS ENUM('web', 'import', 'admin');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'pending_review', 'open', 'in_progress', 'closed', 'cancelled', 'removed');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('spam', 'fraud', 'fake_project', 'duplicate', 'abusive', 'inappropriate', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_target" AS ENUM('project', 'user', 'application', 'message', 'review');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('incomplete', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('email_verify', 'password_reset', 'phone_otp');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('flexible', 'this_month', 'this_week', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('remote', 'on_site', 'hybrid');--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"feature" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"ok" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"type" text NOT NULL,
	"actor_id" uuid,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'submitted' NOT NULL,
	"message" text NOT NULL,
	"price_amount" integer,
	"price_type" "price_type" DEFAULT 'fixed' NOT NULL,
	"estimated_days" integer,
	"is_auto" boolean DEFAULT false NOT NULL,
	"auto_rule_id" uuid,
	"credit_bucket" "credit_bucket",
	"paid_from_plan" boolean DEFAULT false NOT NULL,
	"boosted_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"rejection_reason" text,
	"client_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_bid_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"status" "auto_bid_execution_status" NOT NULL,
	"reason" text,
	"draft_message" text,
	"application_id" uuid,
	"score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_bid_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"mode" "auto_bid_mode" DEFAULT 'review' NOT NULL,
	"category_ids" integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
	"keywords" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"exclude_keywords" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"min_score" integer DEFAULT 80 NOT NULL,
	"min_budget" integer,
	"max_budget" integer,
	"work_modes" text[] DEFAULT ARRAY['remote','on_site','hybrid']::text[] NOT NULL,
	"max_distance_km" integer,
	"require_verified_client" boolean DEFAULT true NOT NULL,
	"daily_cap" integer DEFAULT 3 NOT NULL,
	"template" text NOT NULL,
	"price_amount" integer,
	"price_type" "price_type" DEFAULT 'to_discuss' NOT NULL,
	"estimated_days" integer,
	"personalize_with_ai" boolean DEFAULT true NOT NULL,
	"use_credits_when_no_plan" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "boost_type" NOT NULL,
	"target_id" text NOT NULL,
	"category_id" integer,
	"credits" integer NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"typical_work_mode" "work_mode" DEFAULT 'hybrid' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"options" jsonb,
	"unit" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"status" "collaboration_status" DEFAULT 'pending_confirmation' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_message_preview" text,
	"client_last_read_at" timestamp with time zone,
	"provider_last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"bucket" "credit_bucket" NOT NULL,
	"reason" "credit_reason" NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"idempotency_key" text NOT NULL,
	"promo_balance_after" integer NOT NULL,
	"paid_balance_after" integer NOT NULL,
	"note" text,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"html" text NOT NULL,
	"status" "email_status" DEFAULT 'queued' NOT NULL,
	"provider_message_id" text,
	"error" text,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"county" text NOT NULL,
	"county_code" text NOT NULL,
	"population" integer DEFAULT 0 NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"geo" geography(Point, 4326) GENERATED ALWAYS AS ((CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography END)) STORED,
	"search_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid,
	"body" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"attachment_path" text,
	"attachment_name" text,
	"attachment_size" integer,
	"attachment_type" text,
	"flagged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"admin_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"match_frequency" "digest_frequency" DEFAULT 'instant' NOT NULL,
	"messages_email" boolean DEFAULT true NOT NULL,
	"application_updates_email" boolean DEFAULT true NOT NULL,
	"auto_bid_email" boolean DEFAULT true NOT NULL,
	"product_email" boolean DEFAULT false NOT NULL,
	"min_match_score" integer DEFAULT 60 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"data" jsonb,
	"dedupe_key" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pack_id" text NOT NULL,
	"credits" integer NOT NULL,
	"amount_bani" integer NOT NULL,
	"currency" text DEFAULT 'ron' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"url" text,
	"image_path" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"distance_km" double precision,
	"notified_at" timestamp with time zone,
	"digested_at" timestamp with time zone,
	"seen_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_skills" (
	"project_id" uuid NOT NULL,
	"skill_id" integer NOT NULL,
	CONSTRAINT "project_skills_project_id_skill_id_pk" PRIMARY KEY("project_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "project_status_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"from_status" "project_status",
	"to_status" "project_status" NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category_id" integer NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"budget_type" "budget_type" DEFAULT 'fixed' NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"estimated_hours" integer,
	"work_mode" "work_mode" DEFAULT 'remote' NOT NULL,
	"locality_id" integer,
	"lat" double precision,
	"lng" double precision,
	"geo" geography(Point, 4326) GENERATED ALWAYS AS ((CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography END)) STORED,
	"radius_km" integer DEFAULT 50 NOT NULL,
	"invoice" "invoice_requirement" DEFAULT 'preferred' NOT NULL,
	"urgency" "urgency" DEFAULT 'flexible' NOT NULL,
	"start_date" timestamp with time zone,
	"duration_text" text,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_applications" integer DEFAULT 5 NOT NULL,
	"max_auto_applications" integer DEFAULT 2 NOT NULL,
	"allow_auto_bids" boolean DEFAULT true NOT NULL,
	"applications_count" integer DEFAULT 0 NOT NULL,
	"auto_applications_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"quality" jsonb,
	"ai_summary" text,
	"share_text" text,
	"source" "project_source" DEFAULT 'web' NOT NULL,
	"source_text" text,
	"moderation_note" text,
	"content_hash" text,
	"search_text" text DEFAULT '' NOT NULL,
	"search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
	"published_at" timestamp with time zone,
	"auto_bid_opens_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_categories" (
	"provider_id" uuid NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "provider_categories_provider_id_category_id_pk" PRIMARY KEY("provider_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "provider_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"pricing_model" "pricing_model" DEFAULT 'hourly' NOT NULL,
	"hourly_rate" integer,
	"min_project_budget" integer,
	"remote" boolean DEFAULT true NOT NULL,
	"on_site" boolean DEFAULT false NOT NULL,
	"travel_radius_km" integer DEFAULT 25 NOT NULL,
	"locality_id" integer,
	"lat" double precision,
	"lng" double precision,
	"geo" geography(Point, 4326) GENERATED ALWAYS AS ((CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography END)) STORED,
	"years_experience" integer,
	"languages" text[] DEFAULT ARRAY['ro']::text[] NOT NULL,
	"availability" "availability" DEFAULT 'available' NOT NULL,
	"hours_per_week" integer,
	"website_url" text,
	"certifications" text,
	"response_time_minutes" integer,
	"rating_avg" double precision,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"applications_count" integer DEFAULT 0 NOT NULL,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"boosted_until" timestamp with time zone,
	"featured_until" timestamp with time zone,
	"search_text" text DEFAULT '' NOT NULL,
	"search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"category_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_from" integer,
	"price_unit" "price_unit" DEFAULT 'hour' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_skills" (
	"provider_id" uuid NOT NULL,
	"skill_id" integer NOT NULL,
	CONSTRAINT "provider_skills_provider_id_skill_id_pk" PRIMARY KEY("provider_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid,
	"target_type" "report_target" NOT NULL,
	"target_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolved_by_id" uuid,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collaboration_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"hide_author" boolean DEFAULT false NOT NULL,
	"reply" text,
	"hidden_by_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_projects" (
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_projects_user_id_project_id_pk" PRIMARY KEY("user_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"query" jsonb NOT NULL,
	"alert" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" integer
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'incomplete' NOT NULL,
	"stripe_subscription_id" text,
	"stripe_checkout_session_id" text,
	"monthly_quota" integer NOT NULL,
	"quota_used" integer DEFAULT 0 NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"phone_verified_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_client" boolean DEFAULT false NOT NULL,
	"is_provider" boolean DEFAULT false NOT NULL,
	"onboarded_at" timestamp with time zone,
	"avatar_path" text,
	"locality_id" integer,
	"lat" double precision,
	"lng" double precision,
	"issues_invoice" boolean DEFAULT false NOT NULL,
	"legal_entity" "legal_entity_type" DEFAULT 'none' NOT NULL,
	"company_name" text,
	"company_cui" text,
	"stripe_customer_id" text,
	"referral_code" text,
	"referred_by_id" uuid,
	"welcome_credits_granted_at" timestamp with time zone,
	"banned_at" timestamp with time zone,
	"ban_reason" text,
	"last_seen_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "token_type" NOT NULL,
	"token_hash" text NOT NULL,
	"target" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"promo_balance" integer DEFAULT 0 NOT NULL,
	"paid_balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_bid_executions" ADD CONSTRAINT "auto_bid_executions_rule_id_auto_bid_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."auto_bid_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_bid_executions" ADD CONSTRAINT "auto_bid_executions_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_bid_executions" ADD CONSTRAINT "auto_bid_executions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_bid_rules" ADD CONSTRAINT "auto_bid_rules_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_matches" ADD CONSTRAINT "project_matches_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_matches" ADD CONSTRAINT "project_matches_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_skills" ADD CONSTRAINT "provider_skills_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_skills" ADD CONSTRAINT "provider_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_collaboration_id_collaborations_id_fk" FOREIGN KEY ("collaboration_id") REFERENCES "public"."collaborations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_id_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_projects" ADD CONSTRAINT "saved_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_projects" ADD CONSTRAINT "saved_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_feature_created_idx" ON "ai_usage" USING btree ("feature","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_user_idx" ON "ai_usage" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "application_events_app_idx" ON "application_events" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_project_provider_uq" ON "applications" USING btree ("project_id","provider_id");--> statement-breakpoint
CREATE INDEX "applications_provider_idx" ON "applications" USING btree ("provider_id","created_at");--> statement-breakpoint
CREATE INDEX "applications_project_idx" ON "applications" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auto_bid_executions_uq" ON "auto_bid_executions" USING btree ("provider_id","project_id");--> statement-breakpoint
CREATE INDEX "auto_bid_executions_provider_idx" ON "auto_bid_executions" USING btree ("provider_id","created_at");--> statement-breakpoint
CREATE INDEX "auto_bid_rules_provider_idx" ON "auto_bid_rules" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "boosts_user_idx" ON "boosts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "boosts_active_idx" ON "boosts" USING btree ("type","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collaborations_application_uq" ON "collaborations" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "collaborations_provider_idx" ON "collaborations" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "collaborations_client_idx" ON "collaborations" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_application_uq" ON "conversations" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "conversations_client_idx" ON "conversations" USING btree ("client_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversations_provider_idx" ON "conversations" USING btree ("provider_id","last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_idem_uq" ON "credit_ledger" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "credit_ledger_user_idx" ON "credit_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "email_log_created_idx" ON "email_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_log_dedupe_uq" ON "email_log" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "events_name_created_idx" ON "events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "localities_search_trgm_idx" ON "localities" USING gin ("search_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "localities_county_idx" ON "localities" USING btree ("county_code");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "moderation_actions_target_idx" ON "moderation_actions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_dedupe_uq" ON "notifications" USING btree ("dedupe_key");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_checkout_session_uq" ON "orders" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "portfolio_items_provider_idx" ON "portfolio_items" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_matches_uq" ON "project_matches" USING btree ("project_id","provider_id");--> statement-breakpoint
CREATE INDEX "project_matches_provider_idx" ON "project_matches" USING btree ("provider_id","created_at");--> statement-breakpoint
CREATE INDEX "project_skills_skill_idx" ON "project_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "project_status_history_project_idx" ON "project_status_history" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_status_published_idx" ON "projects" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "projects_client_idx" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "projects_geo_idx" ON "projects" USING gist ("geo");--> statement-breakpoint
CREATE INDEX "projects_search_idx" ON "projects" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "projects_content_hash_idx" ON "projects" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "provider_categories_cat_idx" ON "provider_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_profiles_slug_uq" ON "provider_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "provider_profiles_geo_idx" ON "provider_profiles" USING gist ("geo");--> statement-breakpoint
CREATE INDEX "provider_profiles_search_idx" ON "provider_profiles" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "provider_services_provider_idx" ON "provider_services" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "provider_skills_skill_idx" ON "provider_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reports_target_idx" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_collab_author_uq" ON "reviews" USING btree ("collaboration_id","author_id");--> statement-breakpoint
CREATE INDEX "reviews_target_idx" ON "reviews" USING btree ("target_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_slug_uq" ON "skills" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_uq" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_uq" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "verification_tokens_lookup_idx" ON "verification_tokens" USING btree ("type","token_hash");