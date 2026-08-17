const { eq } = require('drizzle-orm');

const { db, planQuestions } = require('../db');

async function getQuestionsForPlan(questionRows, planName = 'free', database = db) {
    if (planName === 'plus') return questionRows;
    if (questionRows.length === 0) return [];

    const allowedRows = await database.select({ questionId: planQuestions.questionId })
        .from(planQuestions)
        .where(eq(planQuestions.planKey, planName));
    const allowedIds = new Set(allowedRows.map((row) => row.questionId));
    return questionRows.filter((question) => allowedIds.has(question.id));
}

module.exports = { getQuestionsForPlan };
