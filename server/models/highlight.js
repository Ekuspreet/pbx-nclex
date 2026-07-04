const { index, jsonb, pgTable, text, timestamp, uuid } = require('drizzle-orm/pg-core');

const { questions } = require('./question');
const { tests } = require('./test');
const { users } = require('./user');

const highlights = pgTable(
    'highlights',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        testId: uuid('test_id').references(() => tests.id, { onDelete: 'cascade' }),
        questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
        selector: jsonb('selector').notNull(),
        color: text('color').default('yellow').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index('highlights_user_id_idx').on(table.userId),
        testIdx: index('highlights_test_id_idx').on(table.testId),
        questionIdx: index('highlights_question_id_idx').on(table.questionId),
    })
);

module.exports = {
    highlights,
};
