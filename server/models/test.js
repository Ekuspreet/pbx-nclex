const { boolean, index, integer, jsonb, pgEnum, pgTable, timestamp, uuid } = require('drizzle-orm/pg-core');

const { users } = require('./user');

const testStatusEnum = pgEnum('test_status', ['created', 'in_progress', 'completed']);

const tests = pgTable(
    'tests',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        tutorMode: boolean('tutor_mode').default(false).notNull(),
        timed: boolean('timed').default(false).notNull(),
        showRationales: boolean('show_rationales').default(true).notNull(),
        questionCount: integer('question_count').notNull(),
        subjects: jsonb('subjects').default([]).notNull(),
        systems: jsonb('systems').default([]).notNull(),
        status: testStatusEnum('status').default('created').notNull(),
        currentPosition: integer('current_position').default(0).notNull(),
        elapsedMs: integer('elapsed_ms').default(0).notNull(),
        remainingMs: integer('remaining_ms'),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        scoreSummary: jsonb('score_summary').default({}).notNull(),
        submittedAt: timestamp('submitted_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index('tests_user_id_idx').on(table.userId),
        statusIdx: index('tests_status_idx').on(table.status),
    })
);

module.exports = {
    testStatusEnum,
    tests,
};
