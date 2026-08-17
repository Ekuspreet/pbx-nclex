CREATE TABLE "referral_program_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"free_month_duration_days" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_reward_tiers" (
	"min_ordinal" integer PRIMARY KEY NOT NULL,
	"max_ordinal" integer,
	"coins_per_referral" integer NOT NULL,
	"free_months_per_referral" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
