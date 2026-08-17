const { and, desc, eq, gt, sql } = require('drizzle-orm');
const { alias } = require('drizzle-orm/pg-core');

const {
    applicationSettings,
    contentEntries,
    db,
    discountCodes,
    feedbackThreads,
    paymentOrders,
    plans,
    questions,
    referralConversions,
    referralProgramSettings,
    referralRewardTiers,
    subscriptions,
    users,
    wallets,
} = require('../db');

function pagination(total, { limit, offset }) {
    return { total, limit, offset, page: Math.floor(offset / limit) + 1, pageCount: Math.max(1, Math.ceil(total / limit)) };
}

async function countRows(table, condition) {
    let query = db.select({ count: sql`count(*)::int` }).from(table);
    if (condition) query = query.where(condition);
    const [row] = await query;
    return row?.count || 0;
}

async function dashboard(req, res, next) {
    try {
        const now = new Date();
        const [
            totalUsers, verifiedUsers, totalQuestions, activeSubscriptions, paidOrders,
            revenue, referrals, activePromos, openFeedback, walletTotals, recentPayments,
        ] = await Promise.all([
            countRows(users),
            countRows(users, eq(users.emailVerified, true)),
            countRows(questions),
            countRows(subscriptions, gt(subscriptions.expiresAt, now)),
            countRows(paymentOrders, eq(paymentOrders.status, 'paid')),
            db.select({ amount: sql`coalesce(sum(${paymentOrders.amount}), 0)::int` }).from(paymentOrders).where(eq(paymentOrders.status, 'paid')),
            countRows(referralConversions),
            countRows(discountCodes, and(eq(discountCodes.type, 'promo'), eq(discountCodes.active, true))),
            countRows(feedbackThreads, eq(feedbackThreads.status, 'open')),
            db.select({ coins: sql`coalesce(sum(${wallets.coinBalance}), 0)::int`, freeMonths: sql`coalesce(sum(${wallets.bankedFreeMonths}), 0)::int` }).from(wallets),
            db.select({
                id: paymentOrders.id, amount: paymentOrders.amount, currency: paymentOrders.currency,
                status: paymentOrders.status, createdAt: paymentOrders.createdAt,
                userName: users.name, userEmail: users.email,
            }).from(paymentOrders).innerJoin(users, eq(paymentOrders.userId, users.id)).orderBy(desc(paymentOrders.createdAt)).limit(8),
        ]);

        res.status(200).json({
            metrics: {
                totalUsers, verifiedUsers, totalQuestions, activeSubscriptions, paidOrders,
                revenuePaise: revenue[0]?.amount || 0, referrals, activePromos, openFeedback,
                walletCoins: walletTotals[0]?.coins || 0, bankedFreeMonths: walletTotals[0]?.freeMonths || 0,
            },
            recentPayments,
        });
    } catch (error) { next(error); }
}

async function listSubscriptions(req, res, next) {
    try {
        const [rows, total] = await Promise.all([
            db.select({
                id: subscriptions.id, plan: subscriptions.plan, source: subscriptions.source,
                startsAt: subscriptions.startsAt, expiresAt: subscriptions.expiresAt, createdAt: subscriptions.createdAt,
                userName: users.name, userEmail: users.email,
            }).from(subscriptions).innerJoin(users, eq(subscriptions.userId, users.id))
                .orderBy(desc(subscriptions.createdAt)).limit(req.query.limit).offset(req.query.offset),
            countRows(subscriptions),
        ]);
        res.status(200).json({ subscriptions: rows, pagination: pagination(total, req.query) });
    } catch (error) { next(error); }
}

async function listPayments(req, res, next) {
    try {
        const [rows, total] = await Promise.all([
            db.select({
                id: paymentOrders.id, plan: paymentOrders.plan, amount: paymentOrders.amount,
                currency: paymentOrders.currency, status: paymentOrders.status,
                discountAmount: paymentOrders.discountAmount, walletCoinsRedeemed: paymentOrders.walletCoinsRedeemed,
                razorpayOrderId: paymentOrders.razorpayOrderId, fulfilledAt: paymentOrders.fulfilledAt,
                createdAt: paymentOrders.createdAt, userName: users.name, userEmail: users.email,
            }).from(paymentOrders).innerJoin(users, eq(paymentOrders.userId, users.id))
                .orderBy(desc(paymentOrders.createdAt)).limit(req.query.limit).offset(req.query.offset),
            countRows(paymentOrders),
        ]);
        res.status(200).json({ payments: rows, pagination: pagination(total, req.query) });
    } catch (error) { next(error); }
}

async function listReferrals(req, res, next) {
    try {
        const referrers = alias(users, 'referrers');
        const referees = alias(users, 'referees');
        const [rows, total] = await Promise.all([
            db.select({
                id: referralConversions.id, ordinal: referralConversions.ordinal,
                coinsAwarded: referralConversions.coinsAwarded, freeMonthsAwarded: referralConversions.freeMonthsAwarded,
                createdAt: referralConversions.createdAt, referrerName: referrers.name,
                referrerEmail: referrers.email, refereeName: referees.name, refereeEmail: referees.email,
            }).from(referralConversions)
                .innerJoin(referrers, eq(referralConversions.referrerUserId, referrers.id))
                .innerJoin(referees, eq(referralConversions.refereeUserId, referees.id))
                .orderBy(desc(referralConversions.createdAt)).limit(req.query.limit).offset(req.query.offset),
            countRows(referralConversions),
        ]);
        res.status(200).json({ referrals: rows, pagination: pagination(total, req.query) });
    } catch (error) { next(error); }
}

async function configuration(req, res, next) {
    try {
        const [planRows, settingRows, contentRows, tierRows, programRows] = await Promise.all([
            db.select().from(plans).orderBy(plans.sortOrder),
            db.select().from(applicationSettings).orderBy(applicationSettings.key),
            db.select().from(contentEntries).orderBy(contentEntries.group, contentEntries.key),
            db.select().from(referralRewardTiers).orderBy(referralRewardTiers.minOrdinal),
            db.select().from(referralProgramSettings).orderBy(referralProgramSettings.key),
        ]);
        res.status(200).json({ plans: planRows, settings: settingRows, content: contentRows, referralTiers: tierRows, referralProgram: programRows });
    } catch (error) { next(error); }
}

module.exports = { configuration, dashboard, listPayments, listReferrals, listSubscriptions };
