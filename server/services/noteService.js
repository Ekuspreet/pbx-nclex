const { and, desc, eq, sql } = require('drizzle-orm');

const { db, notes, questions, tests } = require('../db');
const { createHttpError } = require('./httpError');
const { toClientQuestion } = require('./questionBankService');
const { getPlan } = require('./planCatalog');

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
        if (!row.questionId) {
            result.push({ ...row, question: null });
            continue;
        }

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

async function listNotes(userId, filters = {}) {
    const conditions = [eq(notes.userId, userId)];

    if (filters.testId) {
        conditions.push(eq(notes.testId, filters.testId));
    }

    if (filters.questionId) {
        conditions.push(eq(notes.questionId, filters.questionId));
    }

    const rows = await db
        .select()
        .from(notes)
        .where(and(...conditions))
        .orderBy(desc(notes.updatedAt));

    return attachQuestionContext(rows);
}

async function getNote(userId, noteId) {
    const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .limit(1);

    if (!note) {
        throw createNotFoundError('Note');
    }

    const [result] = await attachQuestionContext([note]);
    return result;
}

async function createNote(userId, payload, planName = 'free') {
    await assertTestBelongsToUser(userId, payload.testId);
    const limit = getPlan(planName).limits.notes;
    if (limit !== null) {
        const [row] = await db.select({ count: sql`count(*)::int` }).from(notes).where(eq(notes.userId, userId));
        if ((row?.count || 0) >= limit) throw createHttpError(403, `The Free plan allows ${limit} notes. Upgrade to Plus for unlimited notes.`);
    }

    let questionId = payload.questionId || null;
    if (payload.questionReference) {
        const [question] = await db
            .select({ id: questions.id })
            .from(questions)
            .where(eq(questions.questionId, payload.questionReference))
            .limit(1);
        if (!question) throw createNotFoundError('Question');
        questionId = question.id;
    }

    const now = new Date();
    const [note] = await db
        .insert(notes)
        .values({
            userId,
            testId: payload.testId || null,
            questionId,
            title: payload.title,
            content: payload.content,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    const [result] = await attachQuestionContext([note]);
    return result;
}

async function updateNote(userId, noteId, payload) {
    const now = new Date();
    const [note] = await db
        .update(notes)
        .set({
            ...payload,
            updatedAt: now,
        })
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .returning();

    if (!note) {
        throw createNotFoundError('Note');
    }

    const [result] = await attachQuestionContext([note]);
    return result;
}

async function deleteNote(userId, noteId) {
    const [note] = await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .returning();

    if (!note) {
        throw createNotFoundError('Note');
    }

    return note;
}

module.exports = {
    createNote,
    deleteNote,
    getNote,
    listNotes,
    updateNote,
};
