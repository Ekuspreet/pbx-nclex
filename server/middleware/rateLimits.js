const rateLimit = require('express-rate-limit');

function createAuthRateLimit({ windowMinutes, max, message }) {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            message,
        },
    });
}

const signupLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 10,
    message: 'Too many signup attempts. Please try again later.',
});

const loginLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 10,
    message: 'Too many login attempts. Please try again later.',
});

const adminLoginLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 5,
    message: 'Too many admin login attempts. Please try again later.',
});

const otpVerifyLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 10,
    message: 'Too many verification attempts. Please try again later.',
});

const otpResendLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 5,
    message: 'Too many code requests. Please try again later.',
});

const passwordResetLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 5,
    message: 'Too many password reset attempts. Please try again later.',
});

const refreshLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 60,
    message: 'Too many refresh attempts. Please try again later.',
});

const paymentOrderLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 10,
    message: 'Too many payment order requests. Please try again later.',
});

const paymentVerifyLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 20,
    message: 'Too many payment verification requests. Please try again later.',
});

const codePreviewLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 30,
    message: 'Too many code checks. Please try again later.',
});

const referralActivateLimiter = createAuthRateLimit({
    windowMinutes: 15,
    max: 10,
    message: 'Too many activation attempts. Please try again later.',
});

module.exports = {
    adminLoginLimiter,
    codePreviewLimiter,
    loginLimiter,
    otpResendLimiter,
    otpVerifyLimiter,
    passwordResetLimiter,
    paymentOrderLimiter,
    paymentVerifyLimiter,
    referralActivateLimiter,
    refreshLimiter,
    signupLimiter,
};
