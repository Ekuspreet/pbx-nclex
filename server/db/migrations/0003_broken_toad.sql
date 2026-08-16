CREATE TYPE "public"."subscription_source" AS ENUM('purchase', 'referral_free_month');--> statement-breakpoint
CREATE TYPE "public"."discount_code_type" AS ENUM('promo', 'referral');--> statement-breakpoint
CREATE TYPE "public"."wallet_ledger_type" AS ENUM('referral_earn', 'redeem');--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" "discount_code_type" NOT NULL,
	"owner_user_id" uuid,
	"discount_percent" integer DEFAULT 20 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"max_redemptions" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"coin_balance" integer DEFAULT 0 NOT NULL,
	"successful_referral_count" integer DEFAULT 0 NOT NULL,
	"banked_free_months" integer DEFAULT 0 NOT NULL,
	"lifetime_coins_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "wallet_ledger_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"referral_conversion_id" uuid,
	"payment_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referee_user_id" uuid NOT NULL,
	"discount_code_id" uuid NOT NULL,
	"payment_order_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"coins_awarded" integer NOT NULL,
	"free_months_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "payment_order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "applied_discount_code_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "wallet_coins_redeemed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "source" "subscription_source" DEFAULT 'purchase' NOT NULL;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_referral_conversion_id_referral_conversions_id_fk" FOREIGN KEY ("referral_conversion_id") REFERENCES "public"."referral_conversions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referee_user_id_users_id_fk" FOREIGN KEY ("referee_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "discount_codes_code_idx" ON "discount_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "discount_codes_owner_referral_idx" ON "discount_codes" USING btree ("owner_user_id") WHERE "discount_codes"."type" = 'referral';--> statement-breakpoint
CREATE INDEX "discount_codes_owner_user_id_idx" ON "discount_codes" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_user_id_idx" ON "wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_ledger_entries_user_created_idx" ON "wallet_ledger_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_conversions_referee_idx" ON "referral_conversions" USING btree ("referee_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_conversions_payment_order_idx" ON "referral_conversions" USING btree ("payment_order_id");--> statement-breakpoint
CREATE INDEX "referral_conversions_referrer_idx" ON "referral_conversions" USING btree ("referrer_user_id");--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_applied_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("applied_discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE no action ON UPDATE no action;