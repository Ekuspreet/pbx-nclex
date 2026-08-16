const { integer, pgTable, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { users } = require('./user');

const wallets = pgTable(
    'wallets',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        coinBalance: integer('coin_balance').default(0).notNull(),
        successfulReferralCount: integer('successful_referral_count').default(0).notNull(),
        bankedFreeMonths: integer('banked_free_months').default(0).notNull(),
        lifetimeCoinsEarned: integer('lifetime_coins_earned').default(0).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdx: uniqueIndex('wallets_user_id_idx').on(table.userId),
    })
);

module.exports = { wallets };
