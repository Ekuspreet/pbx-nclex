const crypto = require('crypto');

const { env } = require('../../env');

function getHashSecret() {
    if (!env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET is required for auth token hashing');
    }

    return env.REFRESH_TOKEN_SECRET;
}

function hashAuthSecret(value, purpose) {
    return crypto
        .createHmac('sha256', getHashSecret())
        .update(`${purpose}:`)
        .update(value)
        .digest('hex');
}

function timingSafeEqualHex(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') {
        return false;
    }

    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = {
    hashAuthSecret,
    timingSafeEqualHex,
};
