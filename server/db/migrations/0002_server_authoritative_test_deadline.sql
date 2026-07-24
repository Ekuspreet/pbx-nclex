ALTER TABLE "tests" ADD COLUMN "expires_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "tests"
SET "expires_at" = NOW() + (COALESCE("remaining_ms", 0) * INTERVAL '1 millisecond')
WHERE "timed" = true AND "status" = 'in_progress' AND "expires_at" IS NULL;
