const crypto = require('crypto');
const { and, desc, eq } = require('drizzle-orm');
const Razorpay = require('razorpay');

const { db, discountCodes, paymentOrders, paymentWebhookEvents, subscriptions } = require('../db');
const { env } = require('../env');
const { findPlan } = require('./planCatalog');
const { resolveCodeForCheckout, incrementRedemptionCount } = require('./discountCodeService');
const { MIN_PAYABLE_AMOUNT_PAISE, previewRedeemCoins, debitCoins } = require('./walletService');
const { creditReferralConversion } = require('./referralService');
const { computeStackedWindow } = require('./subscriptionStacking');

function createPaymentError(statusCode, message, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

function getRazorpayClient() {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        throw createPaymentError(500, 'Razorpay is not configured.', 'PAYMENT_NOT_CONFIGURED');
    }

    return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

function safeSignatureEqual(expected, received) {
    if (typeof received !== 'string') return false;
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(received, 'utf8');
    return expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function verifyCheckoutSignature(orderId, paymentId, signature) {
    if (!env.RAZORPAY_KEY_SECRET) {
        throw createPaymentError(500, 'Razorpay is not configured.', 'PAYMENT_NOT_CONFIGURED');
    }

    const expected = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    if (!safeSignatureEqual(expected, signature)) {
        throw createPaymentError(400, 'Payment signature verification failed.', 'PAYMENT_INVALID_SIGNATURE');
    }
}

function verifyWebhookSignature(rawBody, signature) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
        throw createPaymentError(500, 'Razorpay webhook is not configured.', 'PAYMENT_WEBHOOK_NOT_CONFIGURED');
    }

    const expected = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    if (!safeSignatureEqual(expected, signature)) {
        throw createPaymentError(400, 'Invalid webhook signature.', 'PAYMENT_INVALID_WEBHOOK_SIGNATURE');
    }
}

async function previewCode(userId, code, planName) {
    const { discountCode, discountAmount } = await resolveCodeForCheckout(userId, code, planName);
    return { discountPercent: discountCode.discountPercent, discountAmount };
}

async function createOrderForUser(userId, planName, { code, redeemCoins } = {}) {
    const plan = await findPlan(planName);
    if (!plan || plan.amount === 0) throw createPaymentError(400, 'Unknown subscription plan.', 'PAYMENT_UNKNOWN_PLAN');

    let discountCode = null;
    let discountAmount = 0;

    if (code) {
        const resolved = await resolveCodeForCheckout(userId, code, planName);
        discountCode = resolved.discountCode;
        discountAmount = resolved.discountAmount;
    }

    const amountAfterCode = plan.amount - discountAmount;
    const walletCoinsRedeemed = redeemCoins ? await previewRedeemCoins(userId, amountAfterCode) : 0;
    const amount = Math.max(MIN_PAYABLE_AMOUNT_PAISE, amountAfterCode - walletCoinsRedeemed * 100);

    const id = crypto.randomUUID();
    const receipt = `plus_${id.replaceAll('-', '').slice(0, 26)}`;
    let razorpayOrder;

    try {
        razorpayOrder = await getRazorpayClient().orders.create({
            amount,
            currency: plan.currency,
            receipt,
            notes: { app_order_id: id, user_id: userId, plan: planName },
        });
    } catch (error) {
        if (error.statusCode === 401 || error.status === 401) {
            throw createPaymentError(502, 'Razorpay authentication failed.', 'PAYMENT_PROVIDER_AUTH_FAILED');
        }
        throw createPaymentError(502, 'Unable to create the Razorpay order.', 'PAYMENT_PROVIDER_ERROR');
    }

    await db.insert(paymentOrders).values({
        id,
        userId,
        plan: planName,
        amount,
        currency: plan.currency,
        razorpayOrderId: razorpayOrder.id,
        appliedDiscountCodeId: discountCode?.id || null,
        discountAmount,
        walletCoinsRedeemed,
    });

    return {
        order_id: razorpayOrder.id,
        amount,
        currency: plan.currency,
        planAmount: plan.amount,
        discountAmount,
        walletCoinsRedeemed,
    };
}

function assertCapturedPayment(payment, order) {
    const amount = Number(payment.amount);
    const currency = String(payment.currency || '').toUpperCase();

    if (payment.status !== 'captured' || payment.order_id !== order.razorpayOrderId ||
        amount !== order.amount || currency !== order.currency) {
        throw createPaymentError(409, 'Payment has not been captured for the expected order amount.', 'PAYMENT_NOT_CAPTURED');
    }
}

async function fulfillOrder(tx, orderId, paymentId, now = new Date()) {
    const [order] = await tx
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, orderId))
        .limit(1)
        .for('update');

    if (!order) throw createPaymentError(404, 'Payment order was not found.', 'PAYMENT_ORDER_NOT_FOUND');

    if (order.fulfilledAt) {
        if (order.razorpayPaymentId !== paymentId) {
            throw createPaymentError(409, 'This order was fulfilled by a different payment.', 'PAYMENT_ORDER_ALREADY_FULFILLED');
        }

        const [existing] = await tx.select().from(subscriptions)
            .where(eq(subscriptions.paymentOrderId, order.id)).limit(1);
        return existing;
    }

    const plan = await findPlan(order.plan, tx);
    if (!plan) throw createPaymentError(409, 'The purchased plan is no longer configured.', 'PAYMENT_PLAN_NOT_CONFIGURED');
    const { startsAt, expiresAt } = await computeStackedWindow(tx, order.userId, plan.durationDays, now);
    const [subscription] = await tx.insert(subscriptions).values({
        userId: order.userId,
        paymentOrderId: order.id,
        plan: order.plan,
        startsAt,
        expiresAt,
    }).returning();

    if (order.walletCoinsRedeemed > 0) {
        await debitCoins(tx, order.userId, order.walletCoinsRedeemed, order.id, now);
    }

    if (order.appliedDiscountCodeId) {
        const [appliedCode] = await tx.select().from(discountCodes).where(eq(discountCodes.id, order.appliedDiscountCodeId)).limit(1);
        if (appliedCode) {
            await incrementRedemptionCount(tx, appliedCode.id);
            if (appliedCode.type === 'referral') {
                await creditReferralConversion(tx, {
                    referrerUserId: appliedCode.ownerUserId,
                    refereeUserId: order.userId,
                    discountCodeId: appliedCode.id,
                    paymentOrderId: order.id,
                }, now);
            }
        }
    }

    await tx.update(paymentOrders).set({
        razorpayPaymentId: paymentId,
        status: 'paid',
        fulfilledAt: now,
        updatedAt: now,
    }).where(eq(paymentOrders.id, order.id));

    return subscription;
}

async function verifyBrowserPayment(userId, { orderId, paymentId, signature }) {
    const [order] = await db.select().from(paymentOrders).where(and(
        eq(paymentOrders.razorpayOrderId, orderId),
        eq(paymentOrders.userId, userId)
    )).limit(1);

    if (!order) throw createPaymentError(404, 'Payment order was not found.', 'PAYMENT_ORDER_NOT_FOUND');

    verifyCheckoutSignature(order.razorpayOrderId, paymentId, signature);

    let payment;
    try {
        payment = await getRazorpayClient().payments.fetch(paymentId);
    } catch {
        throw createPaymentError(502, 'Unable to confirm the payment with Razorpay.', 'PAYMENT_PROVIDER_ERROR');
    }
    assertCapturedPayment(payment, order);

    return db.transaction((tx) => fulfillOrder(tx, order.id, paymentId));
}

async function processWebhook({ eventId, eventType, payment }) {
    if (!eventId) throw createPaymentError(400, 'Webhook event ID is required.', 'PAYMENT_WEBHOOK_EVENT_ID_REQUIRED');
    if (!['payment.captured', 'order.paid'].includes(eventType)) return null;
    if (!payment?.id || !payment?.order_id) {
        throw createPaymentError(400, 'Webhook payment details are missing.', 'PAYMENT_WEBHOOK_INVALID_PAYLOAD');
    }

    const [order] = await db.select().from(paymentOrders)
        .where(eq(paymentOrders.razorpayOrderId, payment.order_id)).limit(1);
    if (!order) return null;
    assertCapturedPayment(payment, order);

    return db.transaction(async (tx) => {
        const [recordedEvent] = await tx.insert(paymentWebhookEvents)
            .values({ id: eventId, eventType })
            .onConflictDoNothing()
            .returning();
        if (!recordedEvent) return null;
        return fulfillOrder(tx, order.id, payment.id);
    });
}

async function listPaymentHistory(userId) {
    return db.select({
        id: paymentOrders.id,
        plan: paymentOrders.plan,
        amount: paymentOrders.amount,
        currency: paymentOrders.currency,
        status: paymentOrders.status,
        paymentId: paymentOrders.razorpayPaymentId,
        paidAt: paymentOrders.fulfilledAt,
        createdAt: paymentOrders.createdAt,
    }).from(paymentOrders).where(eq(paymentOrders.userId, userId)).orderBy(desc(paymentOrders.createdAt));
}

module.exports = {
    createOrderForUser,
    listPaymentHistory,
    previewCode,
    processWebhook,
    verifyBrowserPayment,
    verifyWebhookSignature,
};
