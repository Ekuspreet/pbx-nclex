const { eq, inArray } = require('drizzle-orm');

const freeTrialQuestionIds = require('../questions/free-trial-question-ids.json');
const { closeDb, db, planQuestions, questions } = require('../db');

async function seedPlanQuestions() {
    const rows = await db.select({ id: questions.id, questionId: questions.questionId })
        .from(questions)
        .where(inArray(questions.questionId, freeTrialQuestionIds));
    const found = new Set(rows.map((row) => row.questionId));
    const missing = freeTrialQuestionIds.filter((questionId) => !found.has(questionId));

    await db.transaction(async (tx) => {
        await tx.delete(planQuestions).where(eq(planQuestions.planKey, 'free'));
        if (rows.length > 0) {
            await tx.insert(planQuestions).values(rows.map((row) => ({ planKey: 'free', questionId: row.id })));
        }
    });

    console.log(`Assigned ${rows.length} questions to the Free plan.`);
    if (missing.length > 0) console.warn(`Missing question IDs: ${missing.join(', ')}`);
}

seedPlanQuestions().then(closeDb).catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
});
