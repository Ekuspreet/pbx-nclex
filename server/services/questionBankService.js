const { and, eq, sql } = require('drizzle-orm');

const { db, questionStats, questions } = require('../db');

const MCQ_FORMAT_TYPE_ID = 1;
const MCQ_QUESTION_TYPE_ID = 1;

function normalizeKey(value) {
    return String(value || 'Uncategorized').trim() || 'Uncategorized';
}

function isMcqQuestion(question) {
    return Number(question?.formatTypeId ?? MCQ_FORMAT_TYPE_ID) === MCQ_FORMAT_TYPE_ID
        && Number(question?.questionTypeId ?? MCQ_QUESTION_TYPE_ID) === MCQ_QUESTION_TYPE_ID;
}

function normalizeSourceQuestion(sourceQuestion) {
    const subject = normalizeKey(sourceQuestion.subject);
    const system = normalizeKey(sourceQuestion.system);
    const topic = normalizeKey(sourceQuestion.topic);
    const title = normalizeKey(sourceQuestion.title);

    return {
        exhibits: sourceQuestion.exhibits || [],
        sequenceId: sourceQuestion.sequenceId ?? null,
        questionId: sourceQuestion.questionId,
        questionIndex: sourceQuestion.questionIndex ?? null,
        questionText: sourceQuestion.questionText || '',
        explanationText: sourceQuestion.explanationText || '',
        qbankId: sourceQuestion.qbankId ?? null,
        subjectId: sourceQuestion.subjectId ?? null,
        subject,
        systemId: sourceQuestion.systemId ?? null,
        system,
        topicId: sourceQuestion.topicId ?? null,
        topic,
        titleId: sourceQuestion.titleId ?? null,
        title,
        correctAnswer: String(sourceQuestion.correctAnswer ?? ''),
        answerChoiceList: sourceQuestion.answerChoiceList || [],
        formatTypeId: sourceQuestion.formatTypeId ?? MCQ_FORMAT_TYPE_ID,
        questionTypeId: sourceQuestion.questionTypeId ?? MCQ_QUESTION_TYPE_ID,
        questionMappingReferencesList: sourceQuestion.questionMappingReferencesList || [],
        lastUpdatedDate: sourceQuestion.lastUpdatedDate || null,
        difficultyLevelId: sourceQuestion.difficultyLevelId || null,
        additionalText: sourceQuestion.additionalText || null,
        answerHeader: sourceQuestion.answerHeader || null,
        standards: sourceQuestion.standards || [],
        scoringGuide: sourceQuestion.scoringGuide || null,
        competencyId: sourceQuestion.competencyId ?? null,
        scoreTypeId: sourceQuestion.scoreTypeId ?? null,
    };
}

function getCorrectAnswer(question) {
    if (question.correctAnswer !== undefined && question.correctAnswer !== null) {
        return String(question.correctAnswer);
    }

    return '';
}

function toClientQuestion(question) {
    return {
        id: question.id,
        questionId: question.questionId,
        formatTypeId: question.formatTypeId,
        questionTypeId: question.questionTypeId,
        questionText: question.questionText,
        explanationText: question.explanationText,
        answerChoiceList: (question.answerChoiceList || []).map((choice, index) => ({
            ...choice,
            choiceNumber: index + 1,
            sourceChoiceNumber: choice.choiceNumber ?? null,
            choice: choice.choice,
            isCorrect: String(index + 1) === getCorrectAnswer(question),
        })),
        correctAnswer: getCorrectAnswer(question),
        subjectId: question.subjectId,
        subject: question.subject,
        systemId: question.systemId,
        system: question.system,
        topicId: question.topicId,
        topic: question.topic,
        titleId: question.titleId,
        title: question.title,
        taxonomy: {
            subject: question.subject,
            subjectId: question.subjectId,
            system: question.system,
            systemId: question.systemId,
            topic: question.topic,
            topicId: question.topicId,
            title: question.title,
            titleId: question.titleId,
            competencyId: question.competencyId,
        },
        standards: question.standards || [],
        exhibits: question.exhibits || [],
        questionMappingReferencesList: question.questionMappingReferencesList || [],
        additionalText: question.additionalText,
        scoringGuide: question.scoringGuide,
        answerHeader: question.answerHeader,
        difficultyLevelId: question.difficultyLevelId,
    };
}

function getTaxonomyValue(question, dimension) {
    return normalizeKey(question[dimension]);
}

function buildStatsFromQuestions(questionRows) {
    const groups = new Map();

    for (const question of questionRows) {
        if (!isMcqQuestion(question)) continue;

        for (const dimension of ['subject', 'system']) {
            const label = getTaxonomyValue(question, dimension);
            const key = label;
            const mapKey = `${dimension}:${key}`;
            const current = groups.get(mapKey) || {
                dimension,
                key,
                label,
                totalQuestions: 0,
            };

            current.totalQuestions += 1;
            groups.set(mapKey, current);
        }
    }

    return Array.from(groups.values()).sort((a, b) => (
        a.dimension.localeCompare(b.dimension) || a.label.localeCompare(b.label)
    ));
}

async function rebuildQuestionStats(database = db) {
    const allQuestions = await database
        .select()
        .from(questions)
        .where(and(
            eq(questions.formatTypeId, MCQ_FORMAT_TYPE_ID),
            eq(questions.questionTypeId, MCQ_QUESTION_TYPE_ID)
        ));
    const stats = buildStatsFromQuestions(allQuestions);
    const now = new Date();

    await database.delete(questionStats);

    if (stats.length > 0) {
        await database.insert(questionStats).values(stats.map((stat) => ({
            ...stat,
            createdAt: now,
            updatedAt: now,
        })));
    }

    return stats;
}

async function importQuestionsFromPayload(payload) {
    const questionList = Array.isArray(payload?.questionList) ? payload.questionList : [];
    const now = new Date();

    return db.transaction(async (tx) => {
        let imported = 0;

        for (const sourceQuestion of questionList) {
            const normalized = normalizeSourceQuestion(sourceQuestion);

            if (!isMcqQuestion(normalized)) continue;

            await tx
                .insert(questions)
                .values({
                    ...normalized,
                    createdAt: now,
                    updatedAt: now,
                })
                .onConflictDoUpdate({
                    target: questions.questionId,
                    set: {
                        ...normalized,
                        updatedAt: now,
                    },
                });

            imported += 1;
        }

        const stats = await rebuildQuestionStats(tx);

        return {
            imported,
            statsCount: stats.length,
        };
    });
}

async function getQuestionStats() {
    let stats = await db
        .select()
        .from(questionStats)
        .orderBy(questionStats.dimension, questionStats.label);

    if (stats.length === 0) {
        await rebuildQuestionStats(db);
        stats = await db
            .select()
            .from(questionStats)
            .orderBy(questionStats.dimension, questionStats.label);
    }

    return {
        subjects: stats.filter((stat) => stat.dimension === 'subject'),
        systems: stats.filter((stat) => stat.dimension === 'system'),
    };
}

async function getQuestionById(questionId) {
    const [question] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

    return question || null;
}

async function getQuestionTotal() {
    const [row] = await db
        .select({ count: sql`count(*)::int` })
        .from(questions)
        .where(and(
            eq(questions.formatTypeId, MCQ_FORMAT_TYPE_ID),
            eq(questions.questionTypeId, MCQ_QUESTION_TYPE_ID)
        ));
    return row?.count || 0;
}

function isAnswerCorrect(question, answer) {
    return String(answer ?? '').trim() === getCorrectAnswer(question);
}

function filterQuestions(questionRows, { subjects = [], systems = [] }) {
    const subjectSet = new Set(subjects);
    const systemSet = new Set(systems);

    return questionRows.filter((question) => {
        const questionTypeOk = isMcqQuestion(question);
        const subjectOk = subjectSet.size === 0 || subjectSet.has(getTaxonomyValue(question, 'subject'));
        const systemOk = systemSet.size === 0 || systemSet.has(getTaxonomyValue(question, 'system'));

        return questionTypeOk && subjectOk && systemOk;
    });
}

module.exports = {
    buildStatsFromQuestions,
    filterQuestions,
    getCorrectAnswer,
    getQuestionById,
    getQuestionStats,
    getQuestionTotal,
    importQuestionsFromPayload,
    isAnswerCorrect,
    normalizeSourceQuestion,
    rebuildQuestionStats,
    toClientQuestion,
};
