const { boolean, integer, jsonb, pgTable, text, timestamp } = require('drizzle-orm/pg-core');

const contentEntries = pgTable('content_entries', {
    key: text('key').primaryKey(),
    group: text('group').notNull(),
    content: jsonb('content').notNull(),
    version: integer('version').default(1).notNull(),
    published: boolean('published').default(true).notNull(),
    effectiveAt: timestamp('effective_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = { contentEntries };
