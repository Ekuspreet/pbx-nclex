const { and, desc, eq } = require('drizzle-orm');

const { db, notes, questions, tests } = require('../db');
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

async function createNote(userId, payload) {
    await assertTestBelongsToUser(userId, payload.testId);

    const now = new Date();
    const [note] = await db
        .insert(notes)
        .values({
            userId,
            testId: payload.testId || null,
            questionId: payload.questionId,
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
