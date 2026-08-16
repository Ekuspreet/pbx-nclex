const FREE_MONTH_DURATION_DAYS = 30;

const REFERRAL_TIERS = Object.freeze([
    Object.freeze({ minOrdinal: 1, maxOrdinal: 4, coinsPerReferral: 200, freeMonthsPerReferral: 0 }),
    Object.freeze({ minOrdinal: 5, maxOrdinal: 9, coinsPerReferral: 400, freeMonthsPerReferral: 0 }),
    Object.freeze({ minOrdinal: 10, maxOrdinal: null, coinsPerReferral: 200, freeMonthsPerReferral: 1 }),
]);

function getTierForOrdinal(ordinal) {
    const tier = REFERRAL_TIERS.find(
        (candidate) => ordinal >= candidate.minOrdinal && (candidate.maxOrdinal === null || ordinal <= candidate.maxOrdinal)
    );

    return tier || REFERRAL_TIERS[REFERRAL_TIERS.length - 1];
}

module.exports = { FREE_MONTH_DURATION_DAYS, REFERRAL_TIERS, getTierForOrdinal };
