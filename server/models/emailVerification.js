const { index, integer, pgTable, text, timestamp, uuid } = require('drizzle-orm/pg-core');

const { users } = require('./user');

const emailVerifications = pgTable(
    'email_verifications',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        otpHash: text('otp_hash').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        attemptCount: integer('attempt_count').default(0).notNull(),
        lastSentAt: timestamp('last_sent_at', { withTimezone: true }).notNull(),
        consumedAt: timestamp('consumed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index('email_verifications_user_id_idx').on(table.userId),
        expiresAtIdx: index('email_verifications_expires_at_idx').on(table.expiresAt),
    })
);

module.exports = {
    emailVerifications,
};
