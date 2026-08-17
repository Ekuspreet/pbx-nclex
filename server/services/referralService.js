const crypto = require('crypto');
const { and, eq } = require('drizzle-orm');

const { db, discountCodes, referralConversions, subscriptions } = require('../db');
const { createHttpError } = require('./httpError');
const { computeStackedWindow } = require('./subscriptionStacking');
const { FREE_MONTH_DURATION_DAYS, getTierForOrdinal } = require('./referralTierCatalog');
const walletService = require('./walletService');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const MAX_ATTEMPTS = 5;
const UNIQUE_VIOLATION = '23505';

function generateCode() {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
        code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }
    return code;
}

async function findReferralCode(userId) {
    const [row] = await db
        .select()
        .from(discountCodes)
        .where(and(eq(discountCodes.ownerUserId, userId), eq(discountCodes.type, 'referral')))
        .limit(1);

    return row || null;
}

async function getOrCreateReferralCode(userId) {
    const existing = await findReferralCode(userId);
    if (existing) {
        return existing;
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        try {
            const [created] = await db
                .insert(discountCodes)
                .values({ code: generateCode(), type: 'referral', ownerUserId: userId })
                .returning();
            return created;
        } catch (error) {
            if (error.code !== UNIQUE_VIOLATION) {
                throw error;
            }

            const race = await findReferralCode(userId);
            if (race) {
                return race;
            }
        }
    }

    throw createHttpError(500, 'Unable to generate referral code.', 'REFERRAL_CODE_GENERATION_FAILED');
}

async function getReferralSummary(userId) {
    const [[paidSubscription], wallet] = await Promise.all([
        db.select({ id: subscriptions.id })
            .from(subscriptions)
            .where(and(eq(subscriptions.userId, userId), eq(subscriptions.source, 'purchase')))
            .limit(1),
        walletService.getWalletSummary(userId),
    ]);

    if (!paidSubscription) {
        return { eligible: false, code: null, ...wallet };
    }

    const code = await getOrCreateReferralCode(userId);
    return { eligible: true, code: code.code, ...wallet };
}

async function creditReferralConversion(tx, { referrerUserId, refereeUserId, discountCodeId, paymentOrderId }, now = new Date()) {
    const wallet = await walletService.lockWallet(tx, referrerUserId);
    const ordinal = wallet.successfulReferralCount + 1;
    const tier = getTierForOrdinal(ordinal);

    const [conversion] = await tx
        .insert(referralConversions)
        .values({
            referrerUserId,
            refereeUserId,
            discountCodeId,
            paymentOrderId,
            ordinal,
            coinsAwarded: tier.coinsPerReferral,
            freeMonthsAwarded: tier.freeMonthsPerReferral,
        })
        .onConflictDoNothing({ target: referralConversions.paymentOrderId })
        .returning();

    if (!conversion) {
        return null;
    }

    await walletService.creditReferralReward(tx, wallet, {
        coins: tier.coinsPerReferral,
        freeMonths: tier.freeMonthsPerReferral,
        referralConversionId: conversion.id,
        paymentOrderId,
    }, now);

    return conversion;
}

async function activateBankedFreeMonth(userId) {
    return db.transaction(async (tx) => {
        await walletService.consumeBankedFreeMonth(tx, userId);

        const now = new Date();
        const { startsAt, expiresAt } = await computeStackedWindow(tx, userId, FREE_MONTH_DURATION_DAYS, now);

        const [subscription] = await tx.insert(subscriptions).values({
            userId,
            paymentOrderId: null,
            plan: 'plus',
            source: 'referral_free_month',
            startsAt,
            expiresAt,
        }).returning();

        return subscription;
    });
}

module.exports = {
    getOrCreateReferralCode,
    getReferralSummary,
    creditReferralConversion,
    activateBankedFreeMonth,
};
