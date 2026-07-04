const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { env } = require('../../env');
const { hashAuthSecret } = require('./hash');

const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
};

function requireSecret(secret, name) {
    if (!secret) {
        throw new Error(`${name} is required for authentication tokens`);
    }

    return secret;
}

function signJwt(payload, secret, expiresIn, jwtid) {
    return jwt.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn,
        jwtid,
    });
}

function verifyJwt(token, secret) {
    return jwt.verify(token, secret, {
        algorithms: ['HS256'],
    });
}

function createAccessToken(userId) {
    const tokenId = crypto.randomUUID();
    const token = signJwt(
        {
            sub: userId,
            type: TOKEN_TYPES.ACCESS,
        },
        requireSecret(env.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'),
        env.ACCESS_TOKEN_EXPIRES_IN,
        tokenId
    );

    return {
        token,
        tokenId,
    };
}

function createRefreshToken(userId, existingFamilyId) {
    const tokenId = crypto.randomUUID();
    const familyId = existingFamilyId || crypto.randomUUID();
    const token = signJwt(
        {
            sub: userId,
            type: TOKEN_TYPES.REFRESH,
            familyId,
        },
        requireSecret(env.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET'),
        env.REFRESH_TOKEN_EXPIRES_IN,
        tokenId
    );

    return {
        token,
        tokenHash: hashRefreshToken(token),
        tokenId,
        familyId,
    };
}

function verifyAccessToken(token) {
    const payload = verifyJwt(token, requireSecret(env.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'));

    if (payload.type !== TOKEN_TYPES.ACCESS) {
        throw new Error('Invalid access token type');
    }

    return payload;
}

function verifyRefreshToken(token) {
    const payload = verifyJwt(token, requireSecret(env.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET'));

    if (payload.type !== TOKEN_TYPES.REFRESH) {
        throw new Error('Invalid refresh token type');
    }

    return payload;
}

function hashRefreshToken(token) {
    return hashAuthSecret(token, 'refresh-token');
}

module.exports = {
    TOKEN_TYPES,
    createAccessToken,
    createRefreshToken,
    hashRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
