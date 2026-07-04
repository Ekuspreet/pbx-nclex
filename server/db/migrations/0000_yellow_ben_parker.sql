CREATE TYPE "public"."question_type" AS ENUM('single_choice');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."question_stat_dimension" AS ENUM('subject', 'system');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('created', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."feedback_sender_type" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('open', 'reviewing', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_question_id" integer,
	"source_question_index" integer,
	"source_sequence_id" integer,
	"source_qbank_id" integer,
	"question_type" "question_type" DEFAULT 'single_choice' NOT NULL,
	"stem_html" text NOT NULL,
	"explanation_html" text NOT NULL,
	"choices" jsonb NOT NULL,
	"taxonomy" jsonb NOT NULL,
	"standards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exhibits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"additional_text_html" text,
	"scoring_guide_html" text,
	"answer_header_html" text,
	"difficulty_level_id" integer,
	"last_source_update" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"password_hash" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"google_subject" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"otp_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_sent_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"token_id" text NOT NULL,
	"family_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by_token_id" text,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dimension" "question_stat_dimension" NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tutor_mode" boolean DEFAULT false NOT NULL,
	"timed" boolean DEFAULT false NOT NULL,
	"show_rationales" boolean DEFAULT true NOT NULL,
	"question_count" integer NOT NULL,
	"subjects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"systems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "test_status" DEFAULT 'created' NOT NULL,
	"current_position" integer DEFAULT 0 NOT NULL,
	"elapsed_ms" integer DEFAULT 0 NOT NULL,
	"remaining_ms" integer,
	"score_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"answer" jsonb,
	"is_correct" boolean,
	"checked_at" timestamp with time zone,
	"visited" boolean DEFAULT false NOT NULL,
	"answered" boolean DEFAULT false NOT NULL,
	"marked_for_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_id" uuid,
	"question_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_id" uuid,
	"question_id" uuid NOT NULL,
	"selector" jsonb NOT NULL,
	"color" text DEFAULT 'yellow' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_type" "feedback_sender_type" NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid,
	"test_id" uuid,
	"status" "feedback_status" DEFAULT 'open' NOT NULL,
	"subject" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_messages" ADD CONSTRAINT "feedback_messages_thread_id_feedback_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."feedback_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_threads" ADD CONSTRAINT "feedback_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_threads" ADD CONSTRAINT "feedback_threads_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_threads" ADD CONSTRAINT "feedback_threads_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "questions_source_question_id_idx" ON "questions" USING btree ("source_question_id");--> statement-breakpoint
CREATE INDEX "questions_question_type_idx" ON "questions" USING btree ("question_type");--> statement-breakpoint
CREATE INDEX "questions_difficulty_level_id_idx" ON "questions" USING btree ("difficulty_level_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_normalized_email_idx" ON "users" USING btree ("normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_subject_idx" ON "users" USING btree ("google_subject");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_verifications_user_id_idx" ON "email_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verifications_expires_at_idx" ON "email_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "refresh_sessions_user_id_idx" ON "refresh_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_sessions_token_id_idx" ON "refresh_sessions" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "refresh_sessions_family_id_idx" ON "refresh_sessions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "refresh_sessions_expires_at_idx" ON "refresh_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "password_resets_user_id_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "password_resets_token_hash_idx" ON "password_resets" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "question_stats_dimension_idx" ON "question_stats" USING btree ("dimension");--> statement-breakpoint
CREATE UNIQUE INDEX "question_stats_dimension_key_idx" ON "question_stats" USING btree ("dimension","key");--> statement-breakpoint
CREATE INDEX "tests_user_id_idx" ON "tests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tests_status_idx" ON "tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_questions_test_id_idx" ON "test_questions" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_questions_question_id_idx" ON "test_questions" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_questions_test_question_idx" ON "test_questions" USING btree ("test_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_questions_test_position_idx" ON "test_questions" USING btree ("test_id","position");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_test_id_idx" ON "notes" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "notes_question_id_idx" ON "notes" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "highlights_user_id_idx" ON "highlights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "highlights_test_id_idx" ON "highlights" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "highlights_question_id_idx" ON "highlights" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "feedback_messages_thread_id_idx" ON "feedback_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "feedback_threads_user_id_idx" ON "feedback_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_threads_question_id_idx" ON "feedback_threads" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "feedback_threads_status_idx" ON "feedback_threads" USING btree ("status");