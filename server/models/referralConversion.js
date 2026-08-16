const { index, integer, pgTable, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { discountCodes } = require('./discountCode');
const { paymentOrders } = require('./paymentOrder');
const { users } = require('./user');

const referralConversions = pgTable(
    'referral_conversions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        referrerUserId: uuid('referrer_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        refereeUserId: uuid('referee_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        discountCodeId: uuid('discount_code_id').notNull().references(() => discountCodes.id),
        paymentOrderId: uuid('payment_order_id').notNull().references(() => paymentOrders.id),
        ordinal: integer('ordinal').notNull(),
        coinsAwarded: integer('coins_awarded').notNull(),
        freeMonthsAwarded: integer('free_months_awarded').default(0).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        refereeIdx: uniqueIndex('referral_conversions_referee_idx').on(table.refereeUserId),
        paymentOrderIdx: uniqueIndex('referral_conversions_payment_order_idx').on(table.paymentOrderId),
        referrerIdx: index('referral_conversions_referrer_idx').on(table.referrerUserId),
    })
);

module.exports = { referralConversions };
