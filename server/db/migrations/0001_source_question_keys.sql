DELETE FROM "test_questions";
--> statement-breakpoint
DELETE FROM "notes";
--> statement-breakpoint
DELETE FROM "highlights";
--> statement-breakpoint
DELETE FROM "tests";
--> statement-breakpoint
UPDATE "feedback_threads" SET "question_id" = NULL, "test_id" = NULL;
--> statement-breakpoint
DELETE FROM "question_stats";
--> statement-breakpoint
DROP TABLE IF EXISTS "questions" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "question_type";
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exhibits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sequenceId" integer,
	"questionId" integer NOT NULL,
	"questionIndex" integer,
	"questionText" text NOT NULL,
	"explanationText" text NOT NULL,
	"qbankId" integer,
	"subjectId" integer,
	"subject" text,
	"systemId" integer,
	"system" text,
	"topicId" integer,
	"topic" text,
	"titleId" integer,
	"title" text,
	"correctAnswer" text NOT NULL,
	"answerChoiceList" jsonb NOT NULL,
	"formatTypeId" integer DEFAULT 1 NOT NULL,
	"questionTypeId" integer DEFAULT 1 NOT NULL,
	"questionMappingReferencesList" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lastUpdatedDate" text,
	"difficultyLevelId" integer,
	"additionalText" text,
	"answerHeader" text,
	"standards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scoringGuide" text,
	"competencyId" integer,
	"scoreTypeId" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "feedback_threads" ADD CONSTRAINT "feedback_threads_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "questions_questionId_idx" ON "questions" USING btree ("questionId");
--> statement-breakpoint
CREATE INDEX "questions_questionTypeId_idx" ON "questions" USING btree ("questionTypeId");
--> statement-breakpoint
CREATE INDEX "questions_formatTypeId_idx" ON "questions" USING btree ("formatTypeId");
--> statement-breakpoint
CREATE INDEX "questions_difficultyLevelId_idx" ON "questions" USING btree ("difficultyLevelId");
--> statement-breakpoint
CREATE INDEX "questions_subject_idx" ON "questions" USING btree ("subject");
--> statement-breakpoint
CREATE INDEX "questions_system_idx" ON "questions" USING btree ("system");
