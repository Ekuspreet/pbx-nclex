const jwt = require('jsonwebtoken');

const { env } = require('../env');
const { createHttpError } = require('./httpError');

function getAdminSecret() {
    if (!env.ADMIN_TOKEN_SECRET) {
        throw createHttpError(503, 'Admin auth is not configured.');
    }

    return env.ADMIN_TOKEN_SECRET;
}

function assertAdminPasswordConfigured() {
    if (!env.ADMIN_PASSWORD) {
        throw createHttpError(503, 'Admin password is not configured.');
    }
}

function createAdminToken() {
    return jwt.sign(
        {
            sub: env.ADMIN_USERNAME,
            type: 'admin',
        },
        getAdminSecret(),
        {
            algorithm: 'HS256',
            expiresIn: env.ADMIN_TOKEN_EXPIRES_IN,
        }
    );
}

function verifyAdminToken(token) {
    const payload = jwt.verify(token, getAdminSecret(), {
        algorithms: ['HS256'],
    });

    if (payload.type !== 'admin') {
        throw new Error('Invalid admin token type.');
    }

    return payload;
}

function loginAdmin({ username, password }) {
    assertAdminPasswordConfigured();

    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
        throw createHttpError(401, 'Invalid admin credentials.');
    }

    return {
        admin: {
            username: env.ADMIN_USERNAME,
        },
        token: createAdminToken(),
    };
}

function adminCookieOptions() {
    const options = {
        httpOnly: true,
        secure: env.COOKIE_SECURE === 'true',
        sameSite: env.COOKIE_SAME_SITE,
        path: '/api/v1/admin',
        maxAge: 12 * 60 * 60 * 1000,
    };

    if (env.COOKIE_DOMAIN) {
        options.domain = env.COOKIE_DOMAIN;
    }

    return options;
}

module.exports = {
    adminCookieOptions,
    loginAdmin,
    verifyAdminToken,
};
