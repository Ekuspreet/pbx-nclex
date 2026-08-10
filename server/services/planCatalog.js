const PLAN_CATALOG = Object.freeze({
    free: Object.freeze({
        key: 'free', name: 'Free', amount: 0, currency: 'INR', durationDays: null,
        limits: Object.freeze({ tests: null, questions: 75, notes: 10, highlights: 15 }),
    }),
    plus: Object.freeze({
        key: 'plus', name: 'PBX Nursing Plus', amount: 89900, currency: 'INR', durationDays: 60,
        limits: Object.freeze({ tests: null, questions: null, notes: null, highlights: null }),
    }),
});

function getPlan(planName) {
    return PLAN_CATALOG[planName] || PLAN_CATALOG.free;
}

function getPublicPlans() {
    return Object.values(PLAN_CATALOG).map((plan) => ({ ...plan, limits: { ...plan.limits } }));
}

module.exports = { getPlan, getPublicPlans, PLAN_CATALOG };
