const { pgTable, text, timestamp } = require('drizzle-orm/pg-core');

const paymentWebhookEvents = pgTable('payment_webhook_events', {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = { paymentWebhookEvents };
