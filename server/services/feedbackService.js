const { and, desc, eq } = require('drizzle-orm');

const {
    db,
    feedbackMessages,
    feedbackThreads,
    questions,
    testQuestions,
    tests,
    users,
} = require('../db');
const { createHttpError } = require('./httpError');
const { toClientQuestion } = require('./questionBankService');

function createNotFoundError(resource = 'Resource') {
    return createHttpError(404, `${resource} not found.`);
}

async function attachFeedbackContext(thread) {
    let question = null;
    let user = null;

    if (thread.questionId) {
        const [questionRow] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, thread.questionId))
            .limit(1);

        question = questionRow ? toClientQuestion(questionRow) : null;
    }

    const [userRow] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            status: users.status,
        })
        .from(users)
        .where(eq(users.id, thread.userId))
        .limit(1);

    user = userRow || null;

    return {
        ...thread,
        question,
        user,
    };
}

async function listFeedbackForUser(userId) {
    const rows = await db
        .select()
        .from(feedbackThreads)
        .where(eq(feedbackThreads.userId, userId))
        .orderBy(desc(feedbackThreads.updatedAt));

    return Promise.all(rows.map(attachFeedbackContext));
}

async function listAllFeedback(filters = {}) {
    let query = db
        .select()
        .from(feedbackThreads);

    if (filters.status) {
        query = query.where(eq(feedbackThreads.status, filters.status));
    }

    const rows = await query
        .orderBy(desc(feedbackThreads.updatedAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

    return Promise.all(rows.map(attachFeedbackContext));
}

async function assertFeedbackContextBelongsToUser(database, userId, payload) {
    if (payload.testId) {
        const [test] = await database.select({ id: tests.id }).from(tests).where(and(
            eq(tests.id, payload.testId),
            eq(tests.userId, userId)
        )).limit(1);

        if (!test) throw createNotFoundError('Test');
    }

    if (payload.questionId) {
        const conditions = [eq(questions.id, payload.questionId)];

        if (payload.testId) {
            const [testQuestion] = await database.select({ id: testQuestions.id }).from(testQuestions).where(and(
                eq(testQuestions.testId, payload.testId),
                eq(testQuestions.questionId, payload.questionId)
            )).limit(1);

            if (!testQuestion) throw createNotFoundError('Question');
            return;
        }

        const [question] = await database.select({ id: questions.id }).from(questions).where(and(...conditions)).limit(1);
        if (!question) throw createNotFoundError('Question');
    }
}

async function getFeedbackThread(threadId, userId = null) {
    const conditions = [eq(feedbackThreads.id, threadId)];

    if (userId) {
        conditions.push(eq(feedbackThreads.userId, userId));
    }

    const [thread] = await db
        .select()
        .from(feedbackThreads)
        .where(and(...conditions))
        .limit(1);

    if (!thread) {
        throw createNotFoundError('Feedback thread');
    }

    const messages = await db
        .select()
        .from(feedbackMessages)
        .where(eq(feedbackMessages.threadId, thread.id))
        .orderBy(feedbackMessages.createdAt);

    return {
        thread: await attachFeedbackContext(thread),
        messages,
    };
}

async function createFeedbackThread(userId, payload) {
    const now = new Date();

    const threadId = await db.transaction(async (tx) => {
        await assertFeedbackContextBelongsToUser(tx, userId, payload);

        const [thread] = await tx
            .insert(feedbackThreads)
            .values({
                userId,
                questionId: payload.questionId || null,
                testId: payload.testId || null,
                status: 'open',
                subject: payload.subject,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        await tx
            .insert(feedbackMessages)
            .values({
                threadId: thread.id,
                senderType: 'user',
                message: payload.message,
                createdAt: now,
            });

        return thread.id;
    });

    return getFeedbackThread(threadId, userId);
}

async function addFeedbackReply(threadId, senderType, message, userId = null) {
    const now = new Date();

    await db.transaction(async (tx) => {
        const conditions = [eq(feedbackThreads.id, threadId)];

        if (userId) {
            conditions.push(eq(feedbackThreads.userId, userId));
        }

        const [thread] = await tx
            .select()
            .from(feedbackThreads)
            .where(and(...conditions))
            .limit(1);

        if (!thread) {
            throw createNotFoundError('Feedback thread');
        }

        await tx
            .insert(feedbackMessages)
            .values({
                threadId,
                senderType,
                message,
                createdAt: now,
            });

        await tx
            .update(feedbackThreads)
            .set({
                status: senderType === 'admin' && thread.status === 'open' ? 'reviewing' : thread.status,
                updatedAt: now,
            })
            .where(eq(feedbackThreads.id, threadId));
    });

    return getFeedbackThread(threadId, userId);
}

async function updateFeedbackStatus(threadId, status, userId = null) {
    const now = new Date();
    const conditions = [eq(feedbackThreads.id, threadId)];

    if (userId) {
        conditions.push(eq(feedbackThreads.userId, userId));
    }

    const [thread] = await db
        .update(feedbackThreads)
        .set({
            status,
            updatedAt: now,
        })
        .where(and(...conditions))
        .returning();

    if (!thread) {
        throw createNotFoundError('Feedback thread');
    }

    return attachFeedbackContext(thread);
}

module.exports = {
    addFeedbackReply,
    createFeedbackThread,
    getFeedbackThread,
    listAllFeedback,
    listFeedbackForUser,
    updateFeedbackStatus,
};
