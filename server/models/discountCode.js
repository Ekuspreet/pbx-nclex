const { sql } = require('drizzle-orm');
const { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { users } = require('./user');

const discountCodeTypeEnum = pgEnum('discount_code_type', ['promo', 'referral']);

const discountCodes = pgTable(
    'discount_codes',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        code: text('code').notNull(),
        type: discountCodeTypeEnum('type').notNull(),
        ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
        discountPercent: integer('discount_percent').default(20).notNull(),
        active: boolean('active').default(true).notNull(),
        maxRedemptions: integer('max_redemptions'),
        redemptionCount: integer('redemption_count').default(0).notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        codeIdx: uniqueIndex('discount_codes_code_idx').on(table.code),
        ownerReferralIdx: uniqueIndex('discount_codes_owner_referral_idx')
            .on(table.ownerUserId)
            .where(sql`${table.type} = 'referral'`),
        ownerIdx: index('discount_codes_owner_user_id_idx').on(table.ownerUserId),
        discountPercentCheck: check('discount_codes_discount_percent_check', sql`${table.discountPercent} between 1 and 100`),
        redemptionCountCheck: check('discount_codes_redemption_count_check', sql`${table.redemptionCount} >= 0`),
        maxRedemptionsCheck: check('discount_codes_max_redemptions_check', sql`${table.maxRedemptions} is null or ${table.maxRedemptions} > 0`),
    })
);

module.exports = { discountCodeTypeEnum, discountCodes };
