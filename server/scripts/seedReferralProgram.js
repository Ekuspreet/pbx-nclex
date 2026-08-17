const { closeDb, db, referralProgramSettings, referralRewardTiers } = require('../db');

const tiers = [
    { minOrdinal: 1, maxOrdinal: 4, coinsPerReferral: 200, freeMonthsPerReferral: 0, active: true },
    { minOrdinal: 5, maxOrdinal: 9, coinsPerReferral: 400, freeMonthsPerReferral: 0, active: true },
    { minOrdinal: 10, maxOrdinal: null, coinsPerReferral: 200, freeMonthsPerReferral: 1, active: true },
];

async function seedReferralProgram() {
    for (const tier of tiers) {
        await db.insert(referralRewardTiers).values(tier).onConflictDoUpdate({
            target: referralRewardTiers.minOrdinal,
            set: { ...tier, updatedAt: new Date() },
        });
    }
    await db.insert(referralProgramSettings).values({ key: 'default', freeMonthDurationDays: 30 })
        .onConflictDoUpdate({ target: referralProgramSettings.key, set: { freeMonthDurationDays: 30, updatedAt: new Date() } });
    console.log(`Seeded ${tiers.length} referral reward tiers and program settings.`);
}

seedReferralProgram().then(closeDb).catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
});
