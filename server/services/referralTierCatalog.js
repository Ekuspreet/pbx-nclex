const { and, desc, eq, gte, isNull, lte, or } = require('drizzle-orm');

const { db, referralProgramSettings, referralRewardTiers } = require('../db');

async function getTierForOrdinal(ordinal, database = db) {
    const [tier] = await database.select().from(referralRewardTiers).where(and(
        eq(referralRewardTiers.active, true),
        lte(referralRewardTiers.minOrdinal, ordinal),
        or(isNull(referralRewardTiers.maxOrdinal), gte(referralRewardTiers.maxOrdinal, ordinal))
    )).orderBy(desc(referralRewardTiers.minOrdinal)).limit(1);
    if (!tier) throw new Error(`No referral reward tier is configured for ordinal ${ordinal}.`);
    return tier;
}

async function getReferralProgramSettings(database = db) {
    const [settings] = await database.select().from(referralProgramSettings)
        .where(eq(referralProgramSettings.key, 'default')).limit(1);
    if (!settings) throw new Error('Referral settings are not configured. Run npm run db:seed:referrals.');
    return settings;
}

module.exports = { getReferralProgramSettings, getTierForOrdinal };
