DROP TABLE "boosts" CASCADE;--> statement-breakpoint
DROP TABLE "credit_ledger" CASCADE;--> statement-breakpoint
DROP TABLE "orders" CASCADE;--> statement-breakpoint
DROP TABLE "wallets" CASCADE;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "credit_bucket";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "paid_from_plan";--> statement-breakpoint
ALTER TABLE "auto_bid_rules" DROP COLUMN "use_credits_when_no_plan";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "monthly_quota";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "quota_used";--> statement-breakpoint
DROP TYPE "public"."boost_type";--> statement-breakpoint
DROP TYPE "public"."credit_bucket";--> statement-breakpoint
DROP TYPE "public"."credit_reason";--> statement-breakpoint
DROP TYPE "public"."order_status";