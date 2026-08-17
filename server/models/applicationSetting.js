const { jsonb, pgTable, text, timestamp } = require('drizzle-orm/pg-core');

const applicationSettings = pgTable('application_settings', {
    key: text('key').primaryKey(),
    value: jsonb('value').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = { applicationSettings };
