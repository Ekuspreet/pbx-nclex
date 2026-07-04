const { index, pgTable, text, timestamp, uuid } = require('drizzle-orm/pg-core');

const { questions } = require('./question');
const { tests } = require('./test');
const { users } = require('./user');

const notes = pgTable(
    'notes',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        testId: uuid('test_id').references(() => tests.id, { onDelete: 'cascade' }),
        questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        content: text('content').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index('notes_user_id_idx').on(table.userId),
        testIdx: index('notes_test_id_idx').on(table.testId),
        questionIdx: index('notes_question_id_idx').on(table.questionId),
    })
);

module.exports = {
    notes,
};
