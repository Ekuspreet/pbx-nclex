CREATE TABLE "content_entries" (
	"key" text PRIMARY KEY NOT NULL,
	"group" text NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"effective_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
