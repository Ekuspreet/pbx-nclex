const { eq } = require('drizzle-orm');

const { db, discountCodes, subscriptions } = require('../db');
const { createHttpError } = require('./httpError');
const { PLAN_CATALOG } = require('./planCatalog');

async function hasAnySubscription(userId) {
    const [row] = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    return Boolean(row);
}

async function hasPaidSubscription(userId) {
    const rows = await db.select({ id: subscriptions.id, source: subscriptions.source })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));
    return rows.some((row) => row.source === 'purchase');
}

async function resolveCodeForCheckout(userId, rawCode, planName, now = new Date()) {
    const plan = PLAN_CATALOG[planName];
    if (!plan) {
        throw createHttpError(400, 'Unknown subscription plan.', 'PAYMENT_UNKNOWN_PLAN');
    }

    const normalizedCode = String(rawCode || '').trim().toUpperCase();
    if (!normalizedCode) {
        throw createHttpError(400, 'A discount code is required.', 'DISCOUNT_CODE_INVALID');
    }

    const [discountCode] = await db.select().from(discountCodes).where(eq(discountCodes.code, normalizedCode)).limit(1);

    if (!discountCode || !discountCode.active) {
        throw createHttpError(400, 'This code is not valid.', 'DISCOUNT_CODE_INVALID');
    }

    if (discountCode.expiresAt && discountCode.expiresAt < now) {
        throw createHttpError(400, 'This code has expired.', 'DISCOUNT_CODE_EXPIRED');
    }

    if (discountCode.maxRedemptions !== null && discountCode.redemptionCount >= discountCode.maxRedemptions) {
        throw createHttpError(400, 'This code has already been fully redeemed.', 'DISCOUNT_CODE_LIMIT_REACHED');
    }

    if (discountCode.type === 'referral') {
        if (discountCode.ownerUserId === userId) {
            throw createHttpError(400, 'You cannot use your own referral code.', 'REFERRAL_SELF_USE');
        }

        if (!(await hasPaidSubscription(discountCode.ownerUserId))) {
            throw createHttpError(400, 'This referral code is not active yet.', 'REFERRAL_REFERRER_INELIGIBLE');
        }

        if (await hasAnySubscription(userId)) {
            throw createHttpError(400, 'Referral codes can only be used on your first subscription.', 'REFERRAL_REFEREE_INELIGIBLE');
        }
    }

    const discountAmount = Math.round((plan.amount * discountCode.discountPercent) / 100);

    return { discountCode, discountAmount };
}

async function incrementRedemptionCount(tx, discountCodeId) {
    const [discountCode] = await tx.select().from(discountCodes).where(eq(discountCodes.id, discountCodeId)).limit(1).for('update');
    if (!discountCode) {
        return;
    }

    await tx.update(discountCodes)
        .set({ redemptionCount: discountCode.redemptionCount + 1, updatedAt: new Date() })
        .where(eq(discountCodes.id, discountCodeId));
}

module.exports = { resolveCodeForCheckout, incrementRedemptionCount };
