const { index, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { users } = require('./user');

const passwordResets = pgTable(
    'password_resets',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tokenHash: text('token_hash').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        consumedAt: timestamp('consumed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index('password_resets_user_id_idx').on(table.userId),
        tokenHashIdx: uniqueIndex('password_resets_token_hash_idx').on(table.tokenHash),
        expiresAtIdx: index('password_resets_expires_at_idx').on(table.expiresAt),
    })
);

module.exports = {
    passwordResets,
};
