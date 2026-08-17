const { boolean, integer, pgTable, text, timestamp } = require('drizzle-orm/pg-core');

const referralRewardTiers = pgTable('referral_reward_tiers', {
    minOrdinal: integer('min_ordinal').primaryKey(),
    maxOrdinal: integer('max_ordinal'),
    coinsPerReferral: integer('coins_per_referral').notNull(),
    freeMonthsPerReferral: integer('free_months_per_referral').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const referralProgramSettings = pgTable('referral_program_settings', {
    key: text('key').primaryKey(),
    freeMonthDurationDays: integer('free_month_duration_days').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = { referralProgramSettings, referralRewardTiers };
