const { desc, eq } = require('drizzle-orm');

const { db, walletLedgerEntries, wallets } = require('../db');
const { createHttpError } = require('./httpError');
const { getNumberSetting } = require('./applicationSettingService');

async function ensureWallet(dbOrTx, userId) {
    const [existing] = await dbOrTx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (existing) {
        return existing;
    }

    const [created] = await dbOrTx.insert(wallets).values({ userId }).onConflictDoNothing().returning();
    if (created) {
        return created;
    }

    const [row] = await dbOrTx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    return row;
}

async function lockWallet(tx, userId) {
    await ensureWallet(tx, userId);
    const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1).for('update');
    return wallet;
}

async function getWalletSummary(userId) {
    const wallet = await ensureWallet(db, userId);
    return {
        coinBalance: wallet.coinBalance,
        successfulReferralCount: wallet.successfulReferralCount,
        bankedFreeMonths: wallet.bankedFreeMonths,
        lifetimeCoinsEarned: wallet.lifetimeCoinsEarned,
    };
}

async function listLedgerHistory(userId, limit) {
    const resolvedLimit = limit ?? await getNumberSetting('wallet.ledgerHistoryLimit');
    return db
        .select()
        .from(walletLedgerEntries)
        .where(eq(walletLedgerEntries.userId, userId))
        .orderBy(desc(walletLedgerEntries.createdAt))
        .limit(resolvedLimit);
}

async function previewRedeemCoins(userId, amountAfterCodePaise, minimumPayablePaise) {
    const resolvedMinimum = minimumPayablePaise ?? await getNumberSetting('payment.minimumPayablePaise');
    const wallet = await ensureWallet(db, userId);
    const maxCoinsByAmount = Math.floor((amountAfterCodePaise - resolvedMinimum) / 100);
    if (maxCoinsByAmount <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(wallet.coinBalance, maxCoinsByAmount));
}

async function debitCoins(tx, userId, coins, paymentOrderId, now = new Date()) {
    const wallet = await lockWallet(tx, userId);
    if (coins > wallet.coinBalance) {
        throw createHttpError(409, 'Wallet balance changed before checkout completed.', 'WALLET_INSUFFICIENT_BALANCE');
    }

    const balanceAfter = wallet.coinBalance - coins;
    await tx.update(wallets).set({ coinBalance: balanceAfter, updatedAt: now }).where(eq(wallets.id, wallet.id));
    await tx.insert(walletLedgerEntries).values({
        userId,
        type: 'redeem',
        amount: -coins,
        balanceAfter,
        paymentOrderId,
    });

    return balanceAfter;
}

async function creditReferralReward(tx, wallet, { coins, freeMonths, referralConversionId, paymentOrderId }, now = new Date()) {
    const coinBalance = wallet.coinBalance + coins;
    const bankedFreeMonths = wallet.bankedFreeMonths + freeMonths;
    const successfulReferralCount = wallet.successfulReferralCount + 1;
    const lifetimeCoinsEarned = wallet.lifetimeCoinsEarned + coins;

    await tx.update(wallets).set({
        coinBalance,
        successfulReferralCount,
        bankedFreeMonths,
        lifetimeCoinsEarned,
        updatedAt: now,
    }).where(eq(wallets.id, wallet.id));

    await tx.insert(walletLedgerEntries).values({
        userId: wallet.userId,
        type: 'referral_earn',
        amount: coins,
        balanceAfter: coinBalance,
        referralConversionId,
        paymentOrderId,
    });

    return { coinBalance, successfulReferralCount, bankedFreeMonths, lifetimeCoinsEarned };
}

async function consumeBankedFreeMonth(tx, userId, now = new Date()) {
    const wallet = await lockWallet(tx, userId);
    if (wallet.bankedFreeMonths < 1) {
        throw createHttpError(400, 'No banked free months available.', 'WALLET_NO_BANKED_FREE_MONTHS');
    }

    await tx.update(wallets)
        .set({ bankedFreeMonths: wallet.bankedFreeMonths - 1, updatedAt: now })
        .where(eq(wallets.id, wallet.id));

    return wallet;
}

module.exports = {
    ensureWallet,
    lockWallet,
    getWalletSummary,
    listLedgerHistory,
    previewRedeemCoins,
    debitCoins,
    creditReferralReward,
    consumeBankedFreeMonth,
};
