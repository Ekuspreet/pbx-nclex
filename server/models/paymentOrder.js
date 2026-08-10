const { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } = require('drizzle-orm/pg-core');

const { users } = require('./user');

const paymentOrders = pgTable(
    'payment_orders',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        plan: text('plan').notNull(),
        amount: integer('amount').notNull(),
        currency: text('currency').notNull(),
        razorpayOrderId: text('razorpay_order_id').notNull(),
        razorpayPaymentId: text('razorpay_payment_id'),
        status: text('status').default('created').notNull(),
        fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index('payment_orders_user_id_idx').on(table.userId),
        razorpayOrderIdx: uniqueIndex('payment_orders_razorpay_order_id_idx').on(table.razorpayOrderId),
        razorpayPaymentIdx: uniqueIndex('payment_orders_razorpay_payment_id_idx').on(table.razorpayPaymentId),
    })
);

module.exports = { paymentOrders };
