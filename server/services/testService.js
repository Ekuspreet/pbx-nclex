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

async function getUserTest(userId, testId, database = db) {
    const [test] = await database
        .select()
        .from(tests)
        .where(and(eq(tests.id, testId), eq(tests.userId, userId)))
        .limit(1);

    return test || null;
}

async function requireUserTest(userId, testId, database = db) {
    const test = await getUserTest(userId, testId, database);

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

    return db.transaction(async (tx) => {
        const [createdTest] = await tx
            .insert(tests)
            .values({
                userId,
                tutorMode: config.tutorMode,
                timed: config.timed,
                showRationales: config.showRationales,
                questionCount: config.questionCount,
                subjects: config.subjects,
                systems: config.systems,
                status: 'in_progress',
                currentPosition: 0,
                elapsedMs: 0,
                remainingMs,
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
    const test = await requireUserTest(userId, testId, database);
    const { testQuestionsRows, questionRows } = await getTestRows(test.id, database);
    const questionMap = new Map(questionRows.map((question) => [question.id, question]));

    return {
        test,
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

    return db.transaction(async (tx) => {
        const test = await requireUserTest(userId, testId, tx);
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
            test: updatedTest,
            question: combineQuestionState(updatedQuestion, question),
            correctAnswer: shouldCheck ? getCorrectAnswer(question) : null,
        };
    });
}

async function updateQuestionStatus(userId, testId, payload) {
    const now = new Date();

    return db.transaction(async (tx) => {
        const test = await requireUserTest(userId, testId, tx);
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
            test: updatedTest,
            question: updatedQuestion,
        };
    });
}

async function updateTimer(userId, testId, payload) {
    const now = new Date();
    const test = await requireUserTest(userId, testId);
    const set = { updatedAt: now };

    if (typeof payload.elapsedMs === 'number') {
        set.elapsedMs = payload.elapsedMs;
    }

    if (payload.remainingMs !== undefined) {
        set.remainingMs = payload.remainingMs;
    }

    const [updatedTest] = await db
        .update(tests)
        .set(set)
        .where(eq(tests.id, test.id))
        .returning();

    return updatedTest;
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
            correct: 0,
            incorrect: 0,
            unanswered: 0,
        };

        current.total += 1;

        if (!row.answered) {
            current.unanswered += 1;
        } else if (row.isCorrect) {
            current.correct += 1;
        } else {
            current.incorrect += 1;
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

async function submitTest(userId, testId) {
    const now = new Date();

    return db.transaction(async (tx) => {
        const test = await requireUserTest(userId, testId, tx);
        const { testQuestionsRows, questionRows } = await getTestRows(test.id, tx);
        const questionMap = new Map(questionRows.map((question) => [question.id, question]));
        const gradedRows = [];

        for (const row of testQuestionsRows) {
            const question = questionMap.get(row.questionId);
            const isCorrect = row.answered ? isAnswerCorrect(question, row.answer) : false;
            const [updatedRow] = await tx
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
        const [updatedTest] = await tx
            .update(tests)
            .set({
                status: 'completed',
                scoreSummary,
                submittedAt: now,
                updatedAt: now,
            })
            .where(eq(tests.id, test.id))
            .returning();

        return {
            test: updatedTest,
            scoreSummary,
        };
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
    return db
        .select()
        .from(tests)
        .where(eq(tests.userId, userId))
        .orderBy(sql`${tests.updatedAt} desc`);
}

async function getDashboard(userId) {
    const totalQuestions = await getQuestionTotal();
    const userTests = await listUserTests(userId);
    const testIds = userTests.map((test) => test.id);
    let answeredRows = [];

    if (testIds.length > 0) {
        answeredRows = await db
            .select()
            .from(testQuestions)
            .where(and(
                inArray(testQuestions.testId, testIds),
                eq(testQuestions.answered, true)
            ));
    }

    const attemptedQuestionIds = Array.from(new Set(answeredRows.map((row) => row.questionId)));
    let attemptedQuestionRows = [];

    if (attemptedQuestionIds.length > 0) {
        attemptedQuestionRows = await db
            .select()
            .from(questions)
            .where(inArray(questions.id, attemptedQuestionIds));
    }

    let storedStats = await db.select().from(questionStats);

    if (storedStats.length === 0) {
        storedStats = buildStatsFromQuestions(await db.select().from(questions));
    }

    const attemptedStats = buildStatsFromQuestions(attemptedQuestionRows);
    const attemptedMap = new Map(attemptedStats.map((stat) => [`${stat.dimension}:${stat.key}`, stat.totalQuestions]));
    const toRows = (dimension) => storedStats
        .filter((stat) => stat.dimension === dimension)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((stat) => ({
            key: stat.key,
            label: stat.label,
            totalQuestions: stat.totalQuestions,
            attemptedQuestions: attemptedMap.get(`${dimension}:${stat.key}`) || 0,
        }));

    return {
        totalQuestions,
        attemptedQuestions: attemptedQuestionIds.length,
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
