const express = require('express');

const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const {
    loginLimiter,
    otpResendLimiter,
    otpVerifyLimiter,
    passwordResetLimiter,
    refreshLimiter,
    signupLimiter,
} = require('../middleware/rateLimits');
const validate = require('../middleware/validate');
const {
    forgotPasswordSchema,
    googleSignInSchema,
    loginSchema,
    resendOtpSchema,
    resetPasswordSchema,
    signupSchema,
    verifyEmailSchema,
} = require('../validators');

const router = express.Router();

router.post('/signup', signupLimiter, validate({ body: signupSchema }), authController.signup);
router.post('/verify-email', otpVerifyLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post('/resend-otp', otpResendLimiter, validate({ body: resendOtpSchema }), authController.resendOtp);
router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);
router.post('/google', loginLimiter, validate({ body: googleSignInSchema }), authController.google);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.get('/me', authenticate, authController.me);
router.post('/forgot-password', passwordResetLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);

module.exports = router;
