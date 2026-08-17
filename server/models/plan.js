const { boolean, integer, jsonb, pgTable, text, timestamp } = require('drizzle-orm/pg-core');

const plans = pgTable('plans', {
    key: text('key').primaryKey(),
    name: text('name').notNull(),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull(),
    durationDays: integer('duration_days'),
    limits: jsonb('limits').default({}).notNull(),
    active: boolean('active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = { plans };
