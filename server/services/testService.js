const { and, asc, eq, inArray, sql } = require('drizzle-orm');

const {
    db,
    questionStats,
    questions,
    testQuestions,
    tests,
} = require('../db');
const { createHttpError } = require('./httpError');
const {
    buildStatsFromQuestions,
    filterQuestions,
    getCorrectAnswer,
    getQuestionTotal,
    isAnswerCorrect,
    toClientQuestion,
} = require('./questionBankService');

const MS_PER_TIMED_QUESTION = 124000;

function shuffle(items) {
    const next = [...items];

    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }

    return next;
}

function createNotFoundError(resource = 'Resource') {
    return createHttpError(404, `${resource} not found.`);
}

function getRemainingMs(test, now = new Date()) {
    if (!test.timed || !test.expiresAt) {
        return test.remainingMs;
    }

    return Math.max(0, new Date(test.expiresAt).getTime() - now.getTime());
}

function isTimedTestExpired(test, now = new Date()) {
    return test.timed
        && test.status === 'in_progress'
        && getRemainingMs(test, now) <= 0;
}

function withAuthoritativeTiming(test, now = new Date()) {
    return {
        ...test,
        remainingMs: getRemainingMs(test, now),
    };
}

function createTestClosedError(message = 'This test is no longer accepting changes.') {
    return createHttpError(409, message);
}

async function getUserTest(userId, testId, database = db, lock = false) {
    let query = database
        .select()
        .from(tests)
        .where(and(eq(tests.id, testId), eq(tests.userId, userId)));

    if (lock) {
        query = query.for('update');
    }

    const [test] = await query.limit(1);

    return test || null;
}

async function requireUserTest(userId, testId, database = db, lock = false) {
    const test = await getUserTest(userId, testId, database, lock);

    if (!test) {
        throw createNotFoundError('Test');
    }

    return test;
}

async function createTest(userId, config) {
    const allQuestions = await db.select().from(questions);
    const matchingQuestions = filterQuestions(allQuestions, config);

    if (matchingQuestions.length < config.questionCount) {
        throw createHttpError(
            422,
            `Only ${matchingQuestions.length} questions match those filters.`
        );
    }

    const selectedQuestions = shuffle(matchingQuestions).slice(0, config.questionCount);
    const now = new Date();
    const remainingMs = config.timed ? config.questionCount * MS_PER_TIMED_QUESTION : null;
    const expiresAt = config.timed ? new Date(now.getTime() + remainingMs) : null;

    return db.transaction(async (tx) => {
        const [createdTest] = await tx
            .insert(tests)
            .values({
                userId,
                tutorMode: config.tutorMode,
                timed: config.timed,
                showRationales: config.tutorMode,
                questionCount: config.questionCount,
                subjects: config.subjects,
                systems: config.systems,
                status: 'in_progress',
                currentPosition: 0,
                elapsedMs: 0,
                remainingMs,
                expiresAt,
                scoreSummary: {},
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        await tx.insert(testQuestions).values(selectedQuestions.map((question, index) => ({
            testId: createdTest.id,
            questionId: question.id,
            position: index,
            visited: index === 0,
            createdAt: now,
            updatedAt: now,
        })));

        return getTestPayload(userId, createdTest.id, tx);
    });
}

async function getTestRows(testId, database = db) {
    const rows = await database
        .select()
        .from(testQuestions)
        .where(eq(testQuestions.testId, testId))
        .orderBy(asc(testQuestions.position));

    if (rows.length === 0) {
        return {
            testQuestionsRows: [],
            questionRows: [],
        };
    }

    const questionRows = await database
        .select()
        .from(questions)
        .where(inArray(questions.id, rows.map((row) => row.questionId)));
    const questionMap = new Map(questionRows.map((question) => [question.id, question]));

    return {
        testQuestionsRows: rows,
        questionRows: rows.map((row) => questionMap.get(row.questionId)).filter(Boolean),
    };
}

function combineQuestionState(testQuestion, question) {
    return {
        id: testQuestion.id,
        questionId: testQuestion.questionId,
        position: testQuestion.position,
        answer: testQuestion.answer,
        isCorrect: testQuestion.isCorrect,
        checkedAt: testQuestion.checkedAt,
        visited: testQuestion.visited,
        answered: testQuestion.answered,
        markedForReview: testQuestion.markedForReview,
        question: toClientQuestion(question),
    };
}

async function getTestPayload(userId, testId, database = db) {
    let test = await requireUserTest(userId, testId, database);

    if (database === db && isTimedTestExpired(test)) {
        await submitTest(userId, testId);
        test = await requireUserTest(userId, testId, database);
    }

    const { testQuestionsRows, questionRows } = await getTestRows(test.id, database);
    const questionMap = new Map(questionRows.map((question) => [question.id, question]));

    return {
        test: withAuthoritativeTiming(test),
        questions: testQuestionsRows.map((testQuestion) => (
            combineQuestionState(testQuestion, questionMap.get(testQuestion.questionId))
        )),
    };
}

async function updateCurrentPosition(database, test, position, now) {
    if (typeof position !== 'number') {
        return test;
    }

    const [updatedTest] = await database
        .update(tests)
        .set({
            currentPosition: position,
            updatedAt: now,
        })
        .where(eq(tests.id, test.id))
        .returning();

    return updatedTest;
}

async function saveAnswer(userId, testId, payload) {
    const now = new Date();

    const result = await db.transaction(async (tx) => {
        const test = await requireUserTest(userId, testId, tx, true);

        if (test.status !== 'in_progress') {
            throw createTestClosedError();
        }

        if (isTimedTestExpired(test, now)) {
            await finalizeTest(tx, test, now);
            return { expired: true };
        }

        const [testQuestion] = await tx
            .select()
            .from(testQuestions)
            .where(and(
                eq(testQuestions.testId, testId),
                eq(testQuestions.questionId, payload.questionId)
            ))
            .limit(1);

        if (!testQuestion) {
            throw createNotFoundError('Test question');
        }

        const [question] = await tx
            .select()
            .from(questions)
            .where(eq(questions.id, payload.questionId))
            .limit(1);

        const correctness = isAnswerCorrect(question, payload.answer);
        const shouldCheck = test.tutorMode || test.status === 'completed';
        const [updatedQuestion] = await tx
            .update(testQuestions)
            .set({
                answer: payload.answer,
                answered: true,
                visited: true,
                isCorrect: shouldCheck ? correctness : null,
                checkedAt: shouldCheck ? now : null,
                updatedAt: now,
            })
            .where(eq(testQuestions.id, testQuestion.id))
            .returning();

        const updatedTest = await updateCurrentPosition(tx, test, payload.position, now);

        return {
            test: withAuthoritativeTiming(updatedTest, now),
            question: combineQuestionState(updatedQuestion, question),
            correctAnswer: shouldCheck ? getCorrectAnswer(question) : null,
        };
    });

    if (result.expired) {
        throw createTestClosedError('Time expired. The test was submitted automatically.');
    }

    return result;
}

async function updateQuestionStatus(userId, testId, payload) {
    const now = new Date();

    const result = await db.transaction(async (tx) => {
        const test = await requireUserTest(userId, testId, tx, true);

        if (test.status !== 'in_progress') {
            throw createTestClosedError();
        }

        if (isTimedTestExpired(test, now)) {
            await finalizeTest(tx, test, now);
            return { expired: true };
        }

        let updatedQuestion = null;

        if (payload.questionId) {
            const set = { updatedAt: now };

            if (typeof payload.visited === 'boolean') {
                set.visited = payload.visited;
            }

            if (typeof payload.markedForReview === 'boolean') {
                set.markedForReview = payload.markedForReview;
            }

            [updatedQuestion] = await tx
                .update(testQuestions)
                .set(set)
                .where(and(
                    eq(testQuestions.testId, testId),
                    eq(testQuestions.questionId, payload.questionId)
                ))
                .returning();
        }

        const updatedTest = await updateCurrentPosition(tx, test, payload.currentPosition, now);

        return {
            test: withAuthoritativeTiming(updatedTest, now),
            question: updatedQuestion,
        };
    });

    if (result.expired) {
        throw createTestClosedError('Time expired. The test was submitted automatically.');
    }

    return result;
}

async function updateTimer(userId, testId, payload) {
    const now = new Date();
    const result = await db.transaction(async (tx) => {
        const test = await requireUserTest(userId, testId, tx, true);

        if (test.status !== 'in_progress') {
            throw createTestClosedError();
        }

        if (isTimedTestExpired(test, now)) {
            await finalizeTest(tx, test, now);
            return { expired: true };
        }

        if (test.timed) {
            return { test: withAuthoritativeTiming(test, now) };
        }

        const [updatedTest] = await tx
            .update(tests)
            .set({
                elapsedMs: payload.elapsedMs ?? test.elapsedMs,
                updatedAt: now,
            })
            .where(eq(tests.id, test.id))
            .returning();

        return { test: updatedTest };
    });

    if (result.expired) {
        throw createTestClosedError('Time expired. The test was submitted automatically.');
    }

    return result.test;
}

function createBreakdown(questionRows, testQuestionRows, dimension) {
    const questionMap = new Map(questionRows.map((question) => [question.id, question]));
    const groups = new Map();

    for (const row of testQuestionRows) {
        const question = questionMap.get(row.questionId);
        const label = question?.[dimension] || 'Uncategorized';
        const current = groups.get(label) || {
            key: label,
            label,
            total: 0,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
        };

        current.total += 1;

        if (!row.answered) {
            current.unanswered += 1;
        } else {
            current.attempted += 1;

            if (row.isCorrect) {
                current.correct += 1;
            } else {
                current.incorrect += 1;
            }
        }

        groups.set(label, current);
    }

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function buildScoreSummary(questionRows, testQuestionRows) {
    const total = testQuestionRows.length;
    const correct = testQuestionRows.filter((row) => row.answered && row.isCorrect).length;
    const answered = testQuestionRows.filter((row) => row.answered).length;
    const unanswered = total - answered;
    const incorrect = answered - correct;

    return {
        total,
        answered,
        unanswered,
        correct,
        incorrect,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        subjects: createBreakdown(questionRows, testQuestionRows, 'subject'),
        systems: createBreakdown(questionRows, testQuestionRows, 'system'),
    };
}

async function finalizeTest(database, test, now = new Date()) {
    const { testQuestionsRows, questionRows } = await getTestRows(test.id, database);
    const questionMap = new Map(questionRows.map((question) => [question.id, question]));
    const gradedRows = [];

    for (const row of testQuestionsRows) {
        const question = questionMap.get(row.questionId);
        const isCorrect = row.answered ? isAnswerCorrect(question, row.answer) : false;
        const [updatedRow] = await database
            .update(testQuestions)
            .set({
                isCorrect,
                checkedAt: row.answered ? now : null,
                updatedAt: now,
            })
            .where(eq(testQuestions.id, row.id))
            .returning();

        gradedRows.push(updatedRow);
    }

    const scoreSummary = buildScoreSummary(questionRows, gradedRows);
    const [updatedTest] = await database
        .update(tests)
        .set({
            status: 'completed',
            remainingMs: test.timed ? 0 : test.remainingMs,
            scoreSummary,
            submittedAt: now,
            updatedAt: now,
        })
        .where(and(eq(tests.id, test.id), eq(tests.status, 'in_progress')))
        .returning();

    return {
        test: withAuthoritativeTiming(updatedTest || test, now),
        scoreSummary,
    };
}

function getAttemptTimestamp(row) {
    const value = row.checkedAt || row.updatedAt || row.createdAt;
    const time = value ? new Date(value).getTime() : 0;

    return Number.isNaN(time) ? 0 : time;
}

function getLatestQuestionStates(questionStateRows) {
    const attempts = new Map();

    for (const row of questionStateRows) {
        const current = attempts.get(row.questionId);

        if (!current || getAttemptTimestamp(row) >= getAttemptTimestamp(current)) {
            attempts.set(row.questionId, row);
        }
    }

    return Array.from(attempts.values());
}

function getDashboardTaxonomyValue(question, dimension) {
    return String(question?.[dimension] || 'Uncategorized').trim() || 'Uncategorized';
}

function isDashboardAttemptCorrect(row, question) {
    if (!question) {
        return row.isCorrect === true;
    }

    return isAnswerCorrect(question, row.answer);
}

function buildLatestQuestionStats(latestQuestionRows, questionRows) {
    const questionMap = new Map(questionRows.map((question) => [question.id, question]));
    const byDimension = new Map();
    let correctQuestions = 0;
    let incorrectQuestions = 0;
    let omittedQuestions = 0;

    for (const row of latestQuestionRows) {
        const question = questionMap.get(row.questionId);
        const isCorrect = row.answered && isDashboardAttemptCorrect(row, question);

        if (isCorrect) {
            correctQuestions += 1;
        } else if (row.answered) {
            incorrectQuestions += 1;
        } else {
            omittedQuestions += 1;
        }

        for (const dimension of ['subject', 'system']) {
            const label = getDashboardTaxonomyValue(question, dimension);
            const key = label;
            const mapKey = `${dimension}:${key}`;
            const current = byDimension.get(mapKey) || {
                dimension,
                key,
                label,
                attemptedQuestions: 0,
                correctQuestions: 0,
                incorrectQuestions: 0,
                omittedQuestions: 0,
            };

            current.attemptedQuestions += 1;

            if (!row.answered) {
                current.omittedQuestions += 1;
            } else if (isCorrect) {
                current.correctQuestions += 1;
            } else {
                current.incorrectQuestions += 1;
            }

            byDimension.set(mapKey, current);
        }
    }

    return {
        usedQuestions: latestQuestionRows.length,
        attemptedQuestions: latestQuestionRows.length,
        correctQuestions,
        incorrectQuestions,
        partiallyIncorrectQuestions: 0,
        omittedQuestions,
        byDimension,
    };
}

async function submitTest(userId, testId) {
    const now = new Date();

    return db.transaction(async (tx) => {
        const test = await requireUserTest(userId, testId, tx, true);

        if (test.status !== 'in_progress') {
            throw createTestClosedError('This test has already been submitted.');
        }

        return finalizeTest(tx, test, now);
    });
}

async function getTestResult(userId, testId) {
    const payload = await getTestPayload(userId, testId);
    const questionRows = payload.questions.map((item) => item.question);
    const scoreSummary = payload.test.scoreSummary?.total
        ? payload.test.scoreSummary
        : buildScoreSummary(
            questionRows.map((question) => ({
                id: question.id,
                subject: question.subject,
                system: question.system,
            })),
            payload.questions.map((item) => ({
                questionId: item.questionId,
                answered: item.answered,
                isCorrect: item.isCorrect,
            }))
        );

    return {
        ...payload,
        scoreSummary,
    };
}

async function listUserTests(userId) {
    const fetchTests = () => db
        .select()
        .from(tests)
        .where(eq(tests.userId, userId))
        .orderBy(sql`${tests.updatedAt} desc`);
    let userTests = await fetchTests();
    const expiredTests = userTests.filter((test) => isTimedTestExpired(test));

    for (const test of expiredTests) {
        try {
            await submitTest(userId, test.id);
        } catch (error) {
            if (error.statusCode !== 409) throw error;
        }
    }

    if (expiredTests.length > 0) {
        userTests = await fetchTests();
    }

    return userTests.map((test) => withAuthoritativeTiming(test));
}

async function getDashboard(userId) {
    const totalQuestions = await getQuestionTotal();
    const userTests = await listUserTests(userId);
    const testIds = userTests.map((test) => test.id);
    let questionStateRows = [];

    if (testIds.length > 0) {
        questionStateRows = await db
            .select()
            .from(testQuestions)
            .where(inArray(testQuestions.testId, testIds));
    }

    const latestQuestionRows = getLatestQuestionStates(questionStateRows);
    const usedQuestionIds = latestQuestionRows.map((row) => row.questionId);
    let usedQuestionRows = [];

    if (usedQuestionIds.length > 0) {
        usedQuestionRows = await db
            .select()
            .from(questions)
            .where(inArray(questions.id, usedQuestionIds));
    }

    let storedStats = await db.select().from(questionStats);

    if (storedStats.length === 0) {
        storedStats = buildStatsFromQuestions(await db.select().from(questions));
    }

    const usedStats = buildStatsFromQuestions(usedQuestionRows);
    const usedMap = new Map(usedStats.map((stat) => [`${stat.dimension}:${stat.key}`, stat.totalQuestions]));
    const latestQuestionStats = buildLatestQuestionStats(latestQuestionRows, usedQuestionRows);
    const toRows = (dimension) => storedStats
        .filter((stat) => stat.dimension === dimension)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((stat) => {
            const questionStat = latestQuestionStats.byDimension.get(`${dimension}:${stat.key}`);

            return {
                key: stat.key,
                label: stat.label,
                totalQuestions: stat.totalQuestions,
                usedQuestions: usedMap.get(`${dimension}:${stat.key}`) || 0,
                attemptedQuestions: usedMap.get(`${dimension}:${stat.key}`) || 0,
                correctQuestions: questionStat?.correctQuestions || 0,
                incorrectQuestions: questionStat?.incorrectQuestions || 0,
                partiallyIncorrectQuestions: 0,
                omittedQuestions: questionStat?.omittedQuestions || 0,
            };
        });

    return {
        totalQuestions,
        usedQuestions: latestQuestionStats.usedQuestions,
        attemptedQuestions: latestQuestionStats.usedQuestions,
        correctQuestions: latestQuestionStats.correctQuestions,
        incorrectQuestions: latestQuestionStats.incorrectQuestions,
        partiallyIncorrectQuestions: 0,
        omittedQuestions: latestQuestionStats.omittedQuestions,
        subjects: toRows('subject'),
        systems: toRows('system'),
        tests: userTests.slice(0, 8),
    };
}

module.exports = {
    MS_PER_TIMED_QUESTION,
    createTest,
    getDashboard,
    getTestPayload,
    getTestResult,
    listUserTests,
    saveAnswer,
    submitTest,
    updateQuestionStatus,
    updateTimer,
};
