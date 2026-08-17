const { closeDb, db, plans } = require('../db');

const planSeeds = [
    { key: 'free', name: 'Free', amount: 0, currency: 'INR', durationDays: null, limits: { tests: null, questions: 75, notes: 10, highlights: 15 }, active: true, sortOrder: 0 },
    { key: 'plus', name: 'PBX Nursing Plus', amount: 89900, currency: 'INR', durationDays: 60, limits: { tests: null, questions: null, notes: null, highlights: null }, active: true, sortOrder: 10 },
];

async function seedPlans() {
    for (const plan of planSeeds) {
        await db.insert(plans).values(plan).onConflictDoUpdate({ target: plans.key, set: { ...plan, updatedAt: new Date() } });
    }
    console.log(`Seeded ${planSeeds.length} plans.`);
}

seedPlans().then(closeDb).catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
});
