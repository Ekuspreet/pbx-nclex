const { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const questions = pgTable(
    'questions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        exhibits: jsonb('exhibits').default([]).notNull(),
        sequenceId: integer('sequenceId'),
        questionId: integer('questionId').notNull(),
        questionIndex: integer('questionIndex'),
        questionText: text('questionText').notNull(),
        explanationText: text('explanationText').notNull(),
        qbankId: integer('qbankId'),
        subjectId: integer('subjectId'),
        subject: text('subject'),
        systemId: integer('systemId'),
        system: text('system'),
        topicId: integer('topicId'),
        topic: text('topic'),
        titleId: integer('titleId'),
        title: text('title'),
        correctAnswer: text('correctAnswer').notNull(),
        answerChoiceList: jsonb('answerChoiceList').notNull(),
        formatTypeId: integer('formatTypeId').default(1).notNull(),
        questionTypeId: integer('questionTypeId').default(1).notNull(),
        questionMappingReferencesList: jsonb('questionMappingReferencesList').default([]).notNull(),
        lastUpdatedDate: text('lastUpdatedDate'),
        difficultyLevelId: integer('difficultyLevelId'),
        additionalText: text('additionalText'),
        answerHeader: text('answerHeader'),
        standards: jsonb('standards').default([]).notNull(),
        scoringGuide: text('scoringGuide'),
        competencyId: integer('competencyId'),
        scoreTypeId: integer('scoreTypeId'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        questionIdIdx: uniqueIndex('questions_questionId_idx').on(table.questionId),
        questionTypeIdIdx: index('questions_questionTypeId_idx').on(table.questionTypeId),
        formatTypeIdIdx: index('questions_formatTypeId_idx').on(table.formatTypeId),
        difficultyLevelIdIdx: index('questions_difficultyLevelId_idx').on(table.difficultyLevelId),
        subjectIdx: index('questions_subject_idx').on(table.subject),
        systemIdx: index('questions_system_idx').on(table.system),
    })
);

module.exports = {
    questions,
};
