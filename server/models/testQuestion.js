const { boolean, index, integer, jsonb, pgTable, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { questions } = require('./question');
const { tests } = require('./test');

const testQuestions = pgTable(
    'test_questions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        testId: uuid('test_id').notNull().references(() => tests.id, { onDelete: 'cascade' }),
        questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'restrict' }),
        position: integer('position').notNull(),
        answer: jsonb('answer'),
        isCorrect: boolean('is_correct'),
        checkedAt: timestamp('checked_at', { withTimezone: true }),
        visited: boolean('visited').default(false).notNull(),
        answered: boolean('answered').default(false).notNull(),
        markedForReview: boolean('marked_for_review').default(false).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        testIdx: index('test_questions_test_id_idx').on(table.testId),
        questionIdx: index('test_questions_question_id_idx').on(table.questionId),
        testQuestionIdx: uniqueIndex('test_questions_test_question_idx').on(table.testId, table.questionId),
        testPositionIdx: uniqueIndex('test_questions_test_position_idx').on(table.testId, table.position),
    })
);

module.exports = {
    testQuestions,
};
