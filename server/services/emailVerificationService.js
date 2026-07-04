const { and, desc, eq, isNull } = require('drizzle-orm');

const { env } = require('../env');
const { emailVerifications, users } = require('../models');
const {
    generateOtp,
    getOtpExpiresAt,
    hashOtp,
    verifyOtpHash,
} = require('../utils/auth');
const { sendEmailVerificationOtp } = require('./emailService');

function getOtpResendCooldownSeconds(verification, now = new Date()) {
    if (!verification?.lastSentAt) {
        return 0;
    }

    const elapsedSeconds = Math.floor((now.getTime() - verification.lastSentAt.getTime()) / 1000);

    return Math.max(env.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds, 0);
}

async function createEmailVerificationOtpRecord(database, { userId, now = new Date() }) {
    const otp = generateOtp();
    const expiresAt = getOtpExpiresAt(now);
    const otpHash = hashOtp(otp, userId);

    await invalidateUnconsumedEmailVerifications(database, userId, now);

    const [verification] = await database
        .insert(emailVerifications)
        .values({
            userId,
            otpHash,
            expiresAt,
            attemptCount: 0,
            lastSentAt: now,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    return {
        otp,
        verification,
    };
}

async function getLatestUnconsumedEmailVerification(database, userId) {
    const [verification] = await database
        .select()
        .from(emailVerifications)
        .where(and(
            eq(emailVerifications.userId, userId),
            isNull(emailVerifications.consumedAt)
        ))
        .orderBy(desc(emailVerifications.createdAt))
        .limit(1);

    return verification || null;
}

async function invalidateUnconsumedEmailVerifications(database, userId, now = new Date()) {
    await database
        .update(emailVerifications)
        .set({
            consumedAt: now,
            updatedAt: now,
        })
        .where(and(
            eq(emailVerifications.userId, userId),
            isNull(emailVerifications.consumedAt)
        ));
}

async function createEmailVerificationOtp(database, { userId, now = new Date() }) {
    return database.transaction((tx) => createEmailVerificationOtpRecord(tx, { userId, now }));
}

async function createAndSendEmailVerificationOtp(database, { user, now = new Date() }) {
    const result = await createEmailVerificationOtp(database, {
        userId: user.id,
        now,
    });

    await sendEmailVerificationOtp({
        to: user.email,
        name: user.name,
        otp: result.otp,
    });

    return {
        verification: result.verification,
    };
}

async function createResentEmailVerificationOtp(database, { user, now = new Date() }) {
    const latestVerification = await getLatestUnconsumedEmailVerification(database, user.id);
    const retryAfterSeconds = getOtpResendCooldownSeconds(latestVerification, now);

    if (retryAfterSeconds > 0) {
        return {
            ok: false,
            reason: 'cooldown',
            retryAfterSeconds,
        };
    }

    const result = await createAndSendEmailVerificationOtp(database, {
        user,
        now,
    });

    return {
        ok: true,
        verification: result.verification,
    };
}

async function verifyEmailVerificationOtp(database, { userId, otp, now = new Date() }) {
    return database.transaction(async (tx) => {
        const [verification] = await tx
            .select()
            .from(emailVerifications)
            .where(and(
                eq(emailVerifications.userId, userId),
                isNull(emailVerifications.consumedAt)
            ))
            .orderBy(desc(emailVerifications.createdAt))
            .limit(1)
            .for('update');

        if (!verification) {
            return {
                ok: false,
                reason: 'not_found',
            };
        }

        if (verification.expiresAt <= now) {
            return {
                ok: false,
                reason: 'expired',
            };
        }

        if (verification.attemptCount >= env.OTP_MAX_ATTEMPTS) {
            return {
                ok: false,
                reason: 'too_many_attempts',
                attemptsRemaining: 0,
            };
        }

        const isValidOtp = verifyOtpHash(otp, userId, verification.otpHash);

        if (!isValidOtp) {
            const nextAttemptCount = verification.attemptCount + 1;

            await tx
                .update(emailVerifications)
                .set({
                    attemptCount: nextAttemptCount,
                    updatedAt: now,
                })
                .where(eq(emailVerifications.id, verification.id));

            return {
                ok: false,
                reason: nextAttemptCount >= env.OTP_MAX_ATTEMPTS ? 'too_many_attempts' : 'invalid',
                attemptsRemaining: Math.max(env.OTP_MAX_ATTEMPTS - nextAttemptCount, 0),
            };
        }

        await tx
            .update(emailVerifications)
            .set({
                consumedAt: now,
                updatedAt: now,
            })
            .where(eq(emailVerifications.id, verification.id));

        await tx
            .update(users)
            .set({
                emailVerified: true,
                emailVerifiedAt: now,
                updatedAt: now,
            })
            .where(eq(users.id, userId));

        return {
            ok: true,
        };
    });
}

module.exports = {
    createAndSendEmailVerificationOtp,
    createEmailVerificationOtp,
    createEmailVerificationOtpRecord,
    createResentEmailVerificationOtp,
    getLatestUnconsumedEmailVerification,
    getOtpResendCooldownSeconds,
    invalidateUnconsumedEmailVerifications,
    verifyEmailVerificationOtp,
};
