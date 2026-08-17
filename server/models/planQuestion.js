const { pgTable, primaryKey, text, uuid } = require('drizzle-orm/pg-core');

const { plans } = require('./plan');
const { questions } = require('./question');

const planQuestions = pgTable('plan_questions', {
    planKey: text('plan_key').notNull().references(() => plans.key, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.planKey, table.questionId] }),
}));

module.exports = { planQuestions };
