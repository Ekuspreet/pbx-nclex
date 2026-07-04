const { index, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { users } = require('./user');

const refreshSessions = pgTable(
    'refresh_sessions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tokenHash: text('token_hash').notNull(),
        tokenId: text('token_id').notNull(),
        familyId: text('family_id').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        revokedAt: timestamp('revoked_at', { withTimezone: true }),
        replacedByTokenId: text('replaced_by_token_id'),
        userAgent: text('user_agent'),
        ipAddress: text('ip_address'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index('refresh_sessions_user_id_idx').on(table.userId),
        tokenIdIdx: uniqueIndex('refresh_sessions_token_id_idx').on(table.tokenId),
        familyIdIdx: index('refresh_sessions_family_id_idx').on(table.familyId),
        expiresAtIdx: index('refresh_sessions_expires_at_idx').on(table.expiresAt),
    })
);

module.exports = {
    refreshSessions,
};
