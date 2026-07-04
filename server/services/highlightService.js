const { and, desc, eq, isNull } = require('drizzle-orm');

const { db, highlights, questions, tests } = require('../db');
const { createHttpError } = require('./httpError');
const { toClientQuestion } = require('./questionBankService');

function createNotFoundError(resource = 'Resource') {
    return createHttpError(404, `${resource} not found.`);
}

async function assertTestBelongsToUser(userId, testId) {
    if (!testId) {
        return;
    }

    const [test] = await db
        .select()
        .from(tests)
        .where(and(eq(tests.id, testId), eq(tests.userId, userId)))
        .limit(1);

    if (!test) {
        throw createNotFoundError('Test');
    }
}

async function attachQuestionContext(rows) {
    const result = [];

    for (const row of rows) {
        const [question] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, row.questionId))
            .limit(1);

        result.push({
            ...row,
            question: question ? toClientQuestion(question) : null,
        });
    }

    return result;
}

function createTestCondition(column, value) {
    if (value) {
        return eq(column, value);
    }

    return isNull(column);
}

async function listHighlights(userId, filters = {}) {
    const conditions = [eq(highlights.userId, userId)];

    if (filters.testId) {
        conditions.push(eq(highlights.testId, filters.testId));
    }

    if (filters.questionId) {
        conditions.push(eq(highlights.questionId, filters.questionId));
    }

    const rows = await db
        .select()
        .from(highlights)
        .where(and(...conditions))
        .orderBy(desc(highlights.updatedAt));

    return attachQuestionContext(rows);
}

async function createHighlight(userId, payload) {
    await assertTestBelongsToUser(userId, payload.testId);

    const now = new Date();
    const [highlight] = await db
        .insert(highlights)
        .values({
            userId,
            testId: payload.testId || null,
            questionId: payload.questionId,
            selector: payload.selector,
            color: payload.color,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    const [result] = await attachQuestionContext([highlight]);
    return result;
}

async function updateHighlight(userId, highlightId, payload) {
    const now = new Date();
    const [highlight] = await db
        .update(highlights)
        .set({
            ...payload,
            updatedAt: now,
        })
        .where(and(eq(highlights.id, highlightId), eq(highlights.userId, userId)))
        .returning();

    if (!highlight) {
        throw createNotFoundError('Highlight');
    }

    const [result] = await attachQuestionContext([highlight]);
    return result;
}

async function deleteHighlight(userId, highlightId) {
    const [highlight] = await db
        .delete(highlights)
        .where(and(eq(highlights.id, highlightId), eq(highlights.userId, userId)))
        .returning();

    if (!highlight) {
        throw createNotFoundError('Highlight');
    }

    return highlight;
}

async function replaceQuestionHighlights(userId, payload) {
    await assertTestBelongsToUser(userId, payload.testId);

    const now = new Date();

    return db.transaction(async (tx) => {
        await tx
            .delete(highlights)
            .where(and(
                eq(highlights.userId, userId),
                createTestCondition(highlights.testId, payload.testId),
                eq(highlights.questionId, payload.questionId)
            ));

        if (payload.highlights.length === 0) {
            return [];
        }

        const rows = await tx
            .insert(highlights)
            .values(payload.highlights.map((highlight) => ({
                userId,
                testId: payload.testId || null,
                questionId: payload.questionId,
                selector: highlight.selector,
                color: highlight.color,
                createdAt: now,
                updatedAt: now,
            })))
            .returning();

        return rows;
    });
}

module.exports = {
    createHighlight,
    deleteHighlight,
    listHighlights,
    replaceQuestionHighlights,
    updateHighlight,
};
