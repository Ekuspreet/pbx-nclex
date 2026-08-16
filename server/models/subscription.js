const { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { paymentOrders } = require('./paymentOrder');
const { users } = require('./user');

const subscriptionSourceEnum = pgEnum('subscription_source', ['purchase', 'referral_free_month']);

const subscriptions = pgTable(
    'subscriptions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        paymentOrderId: uuid('payment_order_id').references(() => paymentOrders.id),
        plan: text('plan').notNull(),
        source: subscriptionSourceEnum('source').default('purchase').notNull(),
        startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userExpiryIdx: index('subscriptions_user_expiry_idx').on(table.userId, table.expiresAt),
        paymentOrderIdx: uniqueIndex('subscriptions_payment_order_id_idx').on(table.paymentOrderId),
    })
);

module.exports = { subscriptionSourceEnum, subscriptions };
