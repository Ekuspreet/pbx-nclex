CREATE TABLE "plan_questions" (
	"plan_key" text NOT NULL,
	"question_id" uuid NOT NULL,
	CONSTRAINT "plan_questions_plan_key_question_id_pk" PRIMARY KEY("plan_key","question_id")
);
--> statement-breakpoint
ALTER TABLE "plan_questions" ADD CONSTRAINT "plan_questions_plan_key_plans_key_fk" FOREIGN KEY ("plan_key") REFERENCES "public"."plans"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_questions" ADD CONSTRAINT "plan_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;