const { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const userStatusEnum = pgEnum('user_status', ['active', 'disabled', 'deleted']);

const users = pgTable(
    'users',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        email: text('email').notNull(),
        normalizedEmail: text('normalized_email').notNull(),
        passwordHash: text('password_hash'),
        emailVerified: boolean('email_verified').default(false).notNull(),
        emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
        googleSubject: text('google_subject'),
        status: userStatusEnum('status').default('active').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        normalizedEmailIdx: uniqueIndex('users_normalized_email_idx').on(table.normalizedEmail),
        googleSubjectIdx: uniqueIndex('users_google_subject_idx').on(table.googleSubject),
        statusIdx: index('users_status_idx').on(table.status),
    })
);

module.exports = {
    userStatusEnum,
    users,
};
