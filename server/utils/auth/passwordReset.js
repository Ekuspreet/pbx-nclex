const crypto = require('crypto');

const { env } = require('../../env');
const { hashAuthSecret, timingSafeEqualHex } = require('./hash');

function generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('base64url');
}

function hashPasswordResetToken(token) {
    return hashAuthSecret(token, 'password-reset-token');
}

function verifyPasswordResetTokenHash(token, tokenHash) {
    return timingSafeEqualHex(hashPasswordResetToken(token), tokenHash);
}

function getPasswordResetExpiresAt(now = new Date()) {
    return new Date(now.getTime() + env.PASSWORD_RESET_EXPIRES_IN_MINUTES * 60 * 1000);
}

module.exports = {
    generatePasswordResetToken,
    getPasswordResetExpiresAt,
    hashPasswordResetToken,
    verifyPasswordResetTokenHash,
};
