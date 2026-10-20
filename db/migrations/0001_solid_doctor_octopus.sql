ALTER TABLE "users" ADD COLUMN "company_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_verification" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "users_verified_cui_uq" ON "users" USING btree ("company_cui") WHERE "users"."company_verified_at" IS NOT NULL;