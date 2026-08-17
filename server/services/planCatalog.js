const { asc, eq } = require('drizzle-orm');

const { db, plans } = require('../db');

async function findPlan(planName, database = db) {
    const [plan] = await database.select().from(plans).where(eq(plans.key, planName)).limit(1);
    return plan || null;
}

async function getPlan(planName, database = db) {
    const plan = await findPlan(planName, database);
    if (plan) return plan;
    if (planName === 'free') throw new Error('The Free plan is not configured. Run npm run db:seed:plans.');
    return getPlan('free', database);
}

async function getPublicPlans(database = db) {
    return database.select({ key: plans.key, name: plans.name, amount: plans.amount, currency: plans.currency, durationDays: plans.durationDays, limits: plans.limits })
        .from(plans)
        .where(eq(plans.active, true))
        .orderBy(asc(plans.sortOrder));
}

module.exports = { findPlan, getPlan, getPublicPlans };
