const { and, eq, isNull } = require('drizzle-orm');

const { db, passwordResets, users } = require('../db');
const { env } = require('../env');
const {
    createEmailVerificationOtpRecord,
    createResentEmailVerificationOtp,
    verifyEmailVerificationOtp,
} = require('./emailVerificationService');
const {
    createAuthSession,
    revokeAllUserRefreshSessions,
} = require('./authSessionService');
const {
    sendEmailVerificationOtp,
    sendPasswordResetEmail,
} = require('./emailService');
const { verifyGoogleCredential } = require('./googleAuthService');
const {
    generatePasswordResetToken,
    getPasswordResetExpiresAt,
    hashPasswordResetToken,
    hashPassword,
    normalizeEmail,
    toPublicUser,
    verifyPasswordResetTokenHash,
    verifyPasswordWithFallback,
} = require('../utils/auth');

function createAuthError(statusCode, message, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

function assertSignupCanUseExistingUser(user) {
    if (!user) {
        return;
    }

    const isReusableUnverifiedPasswordUser = user.status === 'active' &&
        !user.emailVerified &&
        !user.googleSubject;

    if (isReusableUnverifiedPasswordUser) {
        return;
    }

    throw createAuthError(
        409,
        'Unable to create an account with these details.',
        'AUTH_SIGNUP_CONFLICT'
    );
}

function createInvalidCredentialsError() {
    return createAuthError(
        401,
        'Invalid email or password.',
        'AUTH_INVALID_CREDENTIALS'
    );
}

function createGoogleLinkingConflictError() {
    return createAuthError(
        409,
        'Unable to sign in with this Google account.',
        'AUTH_GOOGLE_LINK_CONFLICT'
    );
}

async function persistSignupUserAndOtp({ name, email, normalizedEmail, passwordHash, now }) {
    return db.transaction(async (tx) => {
        const [existingUser] = await tx
            .select()
            .from(users)
            .where(eq(users.normalizedEmail, normalizedEmail))
            .limit(1)
            .for('update');

        assertSignupCanUseExistingUser(existingUser);

        let user = existingUser;

        if (existingUser) {
            const [updatedUser] = await tx
                .update(users)
                .set({
                    name,
                    email,
                    passwordHash,
                    emailVerified: false,
                    emailVerifiedAt: null,
                    updatedAt: now,
                })
                .where(eq(users.id, existingUser.id))
                .returning();

            user = updatedUser;
        } else {
            const [createdUser] = await tx
                .insert(users)
                .values({
                    name,
                    email,
                    normalizedEmail,
                    passwordHash,
                    emailVerified: false,
                    status: 'active',
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();

            user = createdUser;
        }

        const otpResult = await createEmailVerificationOtpRecord(tx, {
            userId: user.id,
            now,
        });

        return {
            user,
            otp: otpResult.otp,
            verification: otpResult.verification,
        };
    });
}

async function signupWithEmailPassword({ name, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await hashPassword(password);
    const now = new Date();

    let result;

    try {
        result = await persistSignupUserAndOtp({
            name: name.trim(),
            email: email.trim(),
            normalizedEmail,
            passwordHash,
            now,
        });
    } catch (error) {
        if (error.code === '23505') {
            throw createAuthError(
                409,
                'Unable to create an account with these details.',
                'AUTH_SIGNUP_CONFLICT'
            );
        }

        throw error;
    }

    try {
        await sendEmailVerificationOtp({
            to: result.user.email,
            name: result.user.name,
            otp: result.otp,
        });
    } catch (error) {
        throw createAuthError(
            503,
            'Unable to send verification email. Please try again.',
            'AUTH_EMAIL_DELIVERY_FAILED'
        );
    }

    return {
        user: toPublicUser(result.user),
        verification: {
            expiresAt: result.verification.expiresAt,
            resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
        },
    };
}

function getVerifyEmailFailure(reason) {
    if (reason === 'too_many_attempts') {
        return createAuthError(
            429,
            'Too many invalid verification attempts. Request a new verification code.',
            'AUTH_OTP_TOO_MANY_ATTEMPTS'
        );
    }

    return createAuthError(
        400,
        'Invalid or expired verification code.',
        'AUTH_OTP_INVALID'
    );
}

async function verifySignupEmail({ email, otp }) {
    const normalizedEmail = normalizeEmail(email);

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.normalizedEmail, normalizedEmail))
        .limit(1);

    if (!user || user.status !== 'active' || user.emailVerified) {
        throw getVerifyEmailFailure('invalid');
    }

    const result = await verifyEmailVerificationOtp(db, {
        userId: user.id,
        otp,
    });

    if (!result.ok) {
        const error = getVerifyEmailFailure(result.reason);
        error.attemptsRemaining = result.attemptsRemaining;
        throw error;
    }

    return {
        user: toPublicUser({
            ...user,
            emailVerified: true,
        }),
    };
}

async function resendSignupOtp({ email }) {
    const normalizedEmail = normalizeEmail(email);

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.normalizedEmail, normalizedEmail))
        .limit(1);

    if (!user || user.status !== 'active' || user.emailVerified) {
        return {
            sent: false,
        };
    }

    const result = await createResentEmailVerificationOtp(db, {
        user,
    });

    if (!result.ok && result.reason === 'cooldown') {
        const error = createAuthError(
            429,
            'Please wait before requesting another verification code.',
            'AUTH_OTP_RESEND_COOLDOWN'
        );
        error.retryAfterSeconds = result.retryAfterSeconds;
        throw error;
    }

    return {
        sent: true,
        verification: {
            expiresAt: result.verification.expiresAt,
            resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
        },
    };
}

async function loginWithEmailPassword({ email, password, userAgent, ipAddress }) {
    const normalizedEmail = normalizeEmail(email);

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.normalizedEmail, normalizedEmail))
        .limit(1);

    const passwordMatches = await verifyPasswordWithFallback(user?.passwordHash, password);

    if (!user || !passwordMatches) {
        throw createInvalidCredentialsError();
    }

    if (user.status !== 'active') {
        throw createAuthError(
            403,
            'This account is not available.',
            'AUTH_ACCOUNT_UNAVAILABLE'
        );
    }

    if (!user.emailVerified) {
        throw createAuthError(
            403,
            'Email verification is required before logging in.',
            'AUTH_EMAIL_NOT_VERIFIED'
        );
    }

    const session = await createAuthSession(db, {
        userId: user.id,
        userAgent,
        ipAddress,
    });

    return {
        user: toPublicUser(user),
        session,
    };
}

async function persistGoogleUserAndSession({ profile, userAgent, ipAddress, now }) {
    return db.transaction(async (tx) => {
        const [googleUser] = await tx
            .select()
            .from(users)
            .where(eq(users.googleSubject, profile.subject))
            .limit(1)
            .for('update');

        if (googleUser) {
            if (googleUser.status !== 'active') {
                throw createAuthError(
                    403,
                    'This account is not available.',
                    'AUTH_ACCOUNT_UNAVAILABLE'
                );
            }

            const session = await createAuthSession(tx, {
                userId: googleUser.id,
                userAgent,
                ipAddress,
                now,
            });

            return {
                user: googleUser,
                session,
            };
        }

        const normalizedEmail = normalizeEmail(profile.email);
        const [emailUser] = await tx
            .select()
            .from(users)
            .where(eq(users.normalizedEmail, normalizedEmail))
            .limit(1)
            .for('update');

        let user = emailUser;

        if (emailUser) {
            if (
                emailUser.status !== 'active' ||
                !emailUser.emailVerified ||
                emailUser.googleSubject
            ) {
                throw createGoogleLinkingConflictError();
            }

            const [linkedUser] = await tx
                .update(users)
                .set({
                    googleSubject: profile.subject,
                    updatedAt: now,
                })
                .where(eq(users.id, emailUser.id))
                .returning();

            user = linkedUser;
        } else {
            const [createdUser] = await tx
                .insert(users)
                .values({
                    name: profile.name,
                    email: profile.email.trim(),
                    normalizedEmail,
                    passwordHash: null,
                    emailVerified: true,
                    emailVerifiedAt: now,
                    googleSubject: profile.subject,
                    status: 'active',
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();

            user = createdUser;
        }

        const session = await createAuthSession(tx, {
            userId: user.id,
            userAgent,
            ipAddress,
            now,
        });

        return {
            user,
            session,
        };
    });
}

async function loginWithGoogle({ credential, userAgent, ipAddress }) {
    const profile = await verifyGoogleCredential(credential);
    const now = new Date();

    try {
        const result = await persistGoogleUserAndSession({
            profile,
            userAgent,
            ipAddress,
            now,
        });

        return {
            user: toPublicUser(result.user),
            session: result.session,
        };
    } catch (error) {
        if (error.code === '23505') {
            throw createGoogleLinkingConflictError();
        }

        throw error;
    }
}

function buildPasswordResetUrl(token) {
    const resetUrl = new URL('/reset-password', env.CLIENT_URL);
    resetUrl.searchParams.set('token', token);

    return resetUrl.toString();
}

async function createPasswordResetRecord(database, { userId, tokenHash, expiresAt, now }) {
    await database
        .update(passwordResets)
        .set({
            consumedAt: now,
        })
        .where(and(
            eq(passwordResets.userId, userId),
            isNull(passwordResets.consumedAt)
        ));

    const [resetRecord] = await database
        .insert(passwordResets)
        .values({
            userId,
            tokenHash,
            expiresAt,
            createdAt: now,
        })
        .returning();

    return resetRecord;
}

async function requestPasswordReset({ email }) {
    const normalizedEmail = normalizeEmail(email);
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.normalizedEmail, normalizedEmail))
        .limit(1);

    if (!user || user.status !== 'active' || !user.emailVerified) {
        return {
            sent: false,
        };
    }

    const token = generatePasswordResetToken();
    const now = new Date();
    const tokenHash = hashPasswordResetToken(token);
    const expiresAt = getPasswordResetExpiresAt(now);

    await db.transaction((tx) => createPasswordResetRecord(tx, {
        userId: user.id,
        tokenHash,
        expiresAt,
        now,
    }));

    try {
        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl: buildPasswordResetUrl(token),
        });
    } catch (error) {
        console.error('Password reset email delivery failed.');
    }

    return {
        sent: true,
    };
}

async function resetPassword({ token, password }) {
    const passwordHash = await hashPassword(password);
    const tokenHash = hashPasswordResetToken(token);
    const now = new Date();

    return db.transaction(async (tx) => {
        const [resetRecord] = await tx
            .select()
            .from(passwordResets)
            .where(eq(passwordResets.tokenHash, tokenHash))
            .limit(1)
            .for('update');

        if (
            !resetRecord ||
            resetRecord.consumedAt ||
            resetRecord.expiresAt <= now ||
            !verifyPasswordResetTokenHash(token, resetRecord.tokenHash)
        ) {
            throw createAuthError(
                400,
                'Invalid or expired password reset token.',
                'AUTH_RESET_TOKEN_INVALID'
            );
        }

        const [user] = await tx
            .select()
            .from(users)
            .where(eq(users.id, resetRecord.userId))
            .limit(1)
            .for('update');

        if (!user || user.status !== 'active') {
            throw createAuthError(
                400,
                'Invalid or expired password reset token.',
                'AUTH_RESET_TOKEN_INVALID'
            );
        }

        await tx
            .update(users)
            .set({
                passwordHash,
                emailVerified: true,
                emailVerifiedAt: user.emailVerifiedAt || now,
                updatedAt: now,
            })
            .where(eq(users.id, user.id));

        await tx
            .update(passwordResets)
            .set({
                consumedAt: now,
            })
            .where(eq(passwordResets.id, resetRecord.id));

        await revokeAllUserRefreshSessions(tx, user.id, now);

        return {
            user: toPublicUser({
                ...user,
                emailVerified: true,
            }),
        };
    });
}

module.exports = {
    loginWithGoogle,
    loginWithEmailPassword,
    requestPasswordReset,
    resetPassword,
    resendSignupOtp,
    signupWithEmailPassword,
    toPublicUser,
    verifySignupEmail,
};
