const crypto = require('crypto');

const { env } = require('../../env');
const { hashAuthSecret, timingSafeEqualHex } = require('./hash');

const OTP_LENGTH = 6;
const OTP_PATTERN = /^\d{6}$/;

function generateOtp() {
    return String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

function isOtpFormatValid(otp) {
    return typeof otp === 'string' && OTP_PATTERN.test(otp.trim());
}

function hashOtp(otp, userId) {
    return hashAuthSecret(`${userId}:${otp.trim()}`, 'email-verification-otp');
}

function verifyOtpHash(otp, userId, otpHash) {
    if (!isOtpFormatValid(otp)) {
        return false;
    }

    return timingSafeEqualHex(hashOtp(otp, userId), otpHash);
}

function getOtpExpiresAt(now = new Date()) {
    return new Date(now.getTime() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);
}

module.exports = {
    OTP_LENGTH,
    generateOtp,
    getOtpExpiresAt,
    hashOtp,
    isOtpFormatValid,
    verifyOtpHash,
};
