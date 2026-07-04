const { index, pgEnum, pgTable, text, timestamp, uuid } = require('drizzle-orm/pg-core');

const { questions } = require('./question');
const { tests } = require('./test');
const { users } = require('./user');

const feedbackStatusEnum = pgEnum('feedback_status', ['open', 'reviewing', 'resolved', 'closed']);
const feedbackSenderTypeEnum = pgEnum('feedback_sender_type', ['user', 'admin']);

const feedbackThreads = pgTable(
    'feedback_threads',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        questionId: uuid('question_id').references(() => questions.id, { onDelete: 'set null' }),
        testId: uuid('test_id').references(() => tests.id, { onDelete: 'set null' }),
        status: feedbackStatusEnum('status').default('open').notNull(),
        subject: text('subject').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index('feedback_threads_user_id_idx').on(table.userId),
        questionIdx: index('feedback_threads_question_id_idx').on(table.questionId),
        statusIdx: index('feedback_threads_status_idx').on(table.status),
    })
);

const feedbackMessages = pgTable(
    'feedback_messages',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        threadId: uuid('thread_id').notNull().references(() => feedbackThreads.id, { onDelete: 'cascade' }),
        senderType: feedbackSenderTypeEnum('sender_type').notNull(),
        message: text('message').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        threadIdx: index('feedback_messages_thread_id_idx').on(table.threadId),
    })
);

module.exports = {
    feedbackMessages,
    feedbackSenderTypeEnum,
    feedbackStatusEnum,
    feedbackThreads,
};
