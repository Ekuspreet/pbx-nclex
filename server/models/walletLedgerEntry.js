const { index, integer, pgEnum, pgTable, timestamp, uuid } = require('drizzle-orm/pg-core');

const { paymentOrders } = require('./paymentOrder');
const { referralConversions } = require('./referralConversion');
const { users } = require('./user');

const walletLedgerTypeEnum = pgEnum('wallet_ledger_type', ['referral_earn', 'redeem']);

const walletLedgerEntries = pgTable(
    'wallet_ledger_entries',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        type: walletLedgerTypeEnum('type').notNull(),
        amount: integer('amount').notNull(),
        balanceAfter: integer('balance_after').notNull(),
        referralConversionId: uuid('referral_conversion_id').references(() => referralConversions.id, { onDelete: 'set null' }),
        paymentOrderId: uuid('payment_order_id').references(() => paymentOrders.id, { onDelete: 'set null' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userCreatedIdx: index('wallet_ledger_entries_user_created_idx').on(table.userId, table.createdAt),
    })
);

module.exports = { walletLedgerTypeEnum, walletLedgerEntries };
