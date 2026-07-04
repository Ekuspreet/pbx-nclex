const { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const questionStatDimensionEnum = pgEnum('question_stat_dimension', ['subject', 'system']);

const questionStats = pgTable(
    'question_stats',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        dimension: questionStatDimensionEnum('dimension').notNull(),
        key: text('key').notNull(),
        label: text('label').notNull(),
        totalQuestions: integer('total_questions').default(0).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        dimensionIdx: index('question_stats_dimension_idx').on(table.dimension),
        dimensionKeyIdx: uniqueIndex('question_stats_dimension_key_idx').on(table.dimension, table.key),
    })
);

module.exports = {
    questionStatDimensionEnum,
    questionStats,
};
