const { and, eq, isNull } = require('drizzle-orm');

const { db } = require('../db');
const { env } = require('../env');
const { refreshSessions, users } = require('../models');
const {
    createAccessToken,
    createRefreshToken,
    durationToMilliseconds,
    hashRefreshToken,
    toPublicUser,
    timingSafeEqualHex,
    verifyRefreshToken,
} = require('../utils/auth');

const MAX_METADATA_LENGTH = 500;

function truncateMetadata(value) {
    if (!value) {
        return null;
    }

    return String(value).slice(0, MAX_METADATA_LENGTH);
}

function getRequestSessionMetadata(req) {
    return {
        userAgent: truncateMetadata(req.get('user-agent')),
        ipAddress: truncateMetadata(req.ip || req.socket?.remoteAddress),
    };
}

function getRefreshTokenExpiresAt(now = new Date()) {
    return new Date(now.getTime() + durationToMilliseconds(env.REFRESH_TOKEN_EXPIRES_IN));
}

async function createAuthSession(database, {
    userId,
    familyId,
    userAgent,
    ipAddress,
    now = new Date(),
}) {
    const accessToken = createAccessToken(userId);
    const refreshToken = createRefreshToken(userId, familyId);
    const expiresAt = getRefreshTokenExpiresAt(now);

    const [refreshSession] = await database
        .insert(refreshSessions)
        .values({
            userId,
            tokenHash: refreshToken.tokenHash,
            tokenId: refreshToken.tokenId,
            familyId: refreshToken.familyId,
            expiresAt,
            userAgent: truncateMetadata(userAgent),
            ipAddress: truncateMetadata(ipAddress),
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    return {
        accessToken: accessToken.token,
        accessTokenId: accessToken.tokenId,
        refreshToken: refreshToken.token,
        refreshTokenId: refreshToken.tokenId,
        refreshTokenFamilyId: refreshToken.familyId,
        refreshSession,
    };
}

function createRefreshError(message = 'Invalid refresh session.') {
    const error = new Error(message);
    error.statusCode = 401;
    error.code = 'AUTH_REFRESH_INVALID';
    return error;
}

async function revokeRefreshTokenFamily(database, familyId, now = new Date()) {
    await database
        .update(refreshSessions)
        .set({
            revokedAt: now,
            updatedAt: now,
        })
        .where(and(
            eq(refreshSessions.familyId, familyId),
            isNull(refreshSessions.revokedAt)
        ));
}

async function revokeAllUserRefreshSessions(database, userId, now = new Date()) {
    await database
        .update(refreshSessions)
        .set({
            revokedAt: now,
            updatedAt: now,
        })
        .where(and(
            eq(refreshSessions.userId, userId),
            isNull(refreshSessions.revokedAt)
        ));
}

function assertRefreshSessionCanRotate({ payload, refreshSession, tokenHash, user, now }) {
    if (!refreshSession) {
        throw createRefreshError();
    }

    if (!timingSafeEqualHex(refreshSession.tokenHash, tokenHash)) {
        throw createRefreshError();
    }

    if (refreshSession.revokedAt) {
        throw createRefreshError();
    }

    if (refreshSession.expiresAt <= now) {
        throw createRefreshError();
    }

    if (refreshSession.userId !== payload.sub || refreshSession.familyId !== payload.familyId) {
        throw createRefreshError();
    }

    if (!user || user.status !== 'active') {
        throw createRefreshError('Account is not available.');
    }
}

async function rotateRefreshSession(rawRefreshToken, { userAgent, ipAddress, now = new Date() } = {}) {
    let payload;

    try {
        payload = verifyRefreshToken(rawRefreshToken);
    } catch (error) {
        throw createRefreshError();
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    return db.transaction(async (tx) => {
        const [refreshSession] = await tx
            .select()
            .from(refreshSessions)
            .where(eq(refreshSessions.tokenId, payload.jti))
            .limit(1)
            .for('update');

        if (refreshSession?.revokedAt) {
            await revokeRefreshTokenFamily(tx, refreshSession.familyId, now);
            throw createRefreshError();
        }

        const [user] = refreshSession
            ? await tx
                .select()
                .from(users)
                .where(eq(users.id, refreshSession.userId))
                .limit(1)
                .for('update')
            : [];

        assertRefreshSessionCanRotate({
            payload,
            refreshSession,
            tokenHash,
            user,
            now,
        });

        const replacement = await createAuthSession(tx, {
            userId: refreshSession.userId,
            familyId: refreshSession.familyId,
            userAgent,
            ipAddress,
            now,
        });

        await tx
            .update(refreshSessions)
            .set({
                revokedAt: now,
                replacedByTokenId: replacement.refreshTokenId,
                updatedAt: now,
            })
            .where(eq(refreshSessions.id, refreshSession.id));

        return {
            user: toPublicUser(user),
            session: replacement,
        };
    });
}

async function revokeCurrentRefreshSession(rawRefreshToken, now = new Date()) {
    let payload;

    try {
        payload = verifyRefreshToken(rawRefreshToken);
    } catch (error) {
        return false;
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    return db.transaction(async (tx) => {
        const [refreshSession] = await tx
            .select()
            .from(refreshSessions)
            .where(eq(refreshSessions.tokenId, payload.jti))
            .limit(1)
            .for('update');

        if (
            !refreshSession ||
            refreshSession.revokedAt ||
            refreshSession.expiresAt <= now ||
            refreshSession.userId !== payload.sub ||
            refreshSession.familyId !== payload.familyId ||
            !timingSafeEqualHex(refreshSession.tokenHash, tokenHash)
        ) {
            return false;
        }

        await tx
            .update(refreshSessions)
            .set({
                revokedAt: now,
                updatedAt: now,
            })
            .where(eq(refreshSessions.id, refreshSession.id));

        return true;
    });
}

async function revokeAllRefreshSessionsForToken(rawRefreshToken, now = new Date()) {
    let payload;

    try {
        payload = verifyRefreshToken(rawRefreshToken);
    } catch (error) {
        throw createRefreshError();
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    return db.transaction(async (tx) => {
        const [refreshSession] = await tx
            .select()
            .from(refreshSessions)
            .where(eq(refreshSessions.tokenId, payload.jti))
            .limit(1)
            .for('update');

        if (
            !refreshSession ||
            refreshSession.revokedAt ||
            refreshSession.expiresAt <= now ||
            refreshSession.userId !== payload.sub ||
            refreshSession.familyId !== payload.familyId ||
            !timingSafeEqualHex(refreshSession.tokenHash, tokenHash)
        ) {
            throw createRefreshError();
        }

        await revokeAllUserRefreshSessions(tx, refreshSession.userId, now);

        return true;
    });
}

module.exports = {
    createAuthSession,
    getRefreshTokenExpiresAt,
    getRequestSessionMetadata,
    rotateRefreshSession,
    revokeAllRefreshSessionsForToken,
    revokeAllUserRefreshSessions,
    revokeCurrentRefreshSession,
    revokeRefreshTokenFamily,
};
