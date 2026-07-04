const {
    loginWithGoogle,
    loginWithEmailPassword,
    requestPasswordReset,
    resetPassword,
    resendSignupOtp,
    signupWithEmailPassword,
    verifySignupEmail,
} = require('../services/authService');
const {
    getRequestSessionMetadata,
    rotateRefreshSession,
    revokeAllRefreshSessionsForToken,
    revokeCurrentRefreshSession,
} = require('../services/authSessionService');
const { clearAuthCookies, setAuthCookies } = require('../utils/auth');
const { env } = require('../env');

async function signup(req, res, next) {
    try {
        const result = await signupWithEmailPassword(req.body);

        res.status(202).json({
            message: 'Verification code sent. Please check your email.',
            user: result.user,
            emailVerification: result.verification,
        });
    } catch (error) {
        next(error);
    }
}

async function verifyEmail(req, res, next) {
    try {
        const result = await verifySignupEmail(req.body);

        res.status(200).json({
            message: 'Email verified. You can now log in.',
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}

async function resendOtp(req, res, next) {
    try {
        const result = await resendSignupOtp(req.body);

        res.status(202).json({
            message: 'If an eligible account exists, a verification code has been sent.',
            emailVerification: result.verification || null,
        });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const sessionMetadata = getRequestSessionMetadata(req);
        const result = await loginWithEmailPassword({
            ...req.body,
            ...sessionMetadata,
        });

        setAuthCookies(res, {
            accessToken: result.session.accessToken,
            refreshToken: result.session.refreshToken,
        });

        res.status(200).json({
            message: 'Logged in.',
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}

async function google(req, res, next) {
    try {
        const sessionMetadata = getRequestSessionMetadata(req);
        const result = await loginWithGoogle({
            ...req.body,
            ...sessionMetadata,
        });

        setAuthCookies(res, {
            accessToken: result.session.accessToken,
            refreshToken: result.session.refreshToken,
        });

        res.status(200).json({
            message: 'Logged in with Google.',
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}

async function forgotPassword(req, res, next) {
    try {
        await requestPasswordReset(req.body);

        res.status(202).json({
            message: 'If an eligible account exists, a password reset link has been sent.',
        });
    } catch (error) {
        next(error);
    }
}

async function resetPasswordController(req, res, next) {
    try {
        const result = await resetPassword(req.body);
        clearAuthCookies(res);

        res.status(200).json({
            message: 'Password reset successful. Please log in again.',
            user: result.user,
        });
    } catch (error) {
        clearAuthCookies(res);
        next(error);
    }
}

async function refresh(req, res, next) {
    try {
        const refreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];

        if (!refreshToken) {
            const error = new Error('Refresh token is required.');
            error.statusCode = 401;
            throw error;
        }

        const sessionMetadata = getRequestSessionMetadata(req);
        const result = await rotateRefreshSession(refreshToken, sessionMetadata);

        setAuthCookies(res, {
            accessToken: result.session.accessToken,
            refreshToken: result.session.refreshToken,
        });

        res.status(200).json({
            message: 'Session refreshed.',
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        const refreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];

        if (refreshToken) {
            await revokeCurrentRefreshSession(refreshToken);
        }

        clearAuthCookies(res);

        res.status(200).json({
            message: 'Logged out.',
        });
    } catch (error) {
        clearAuthCookies(res);
        next(error);
    }
}

async function logoutAll(req, res, next) {
    try {
        const refreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];

        if (!refreshToken) {
            const error = new Error('Refresh token is required.');
            error.statusCode = 401;
            throw error;
        }

        await revokeAllRefreshSessionsForToken(refreshToken);
        clearAuthCookies(res);

        res.status(200).json({
            message: 'Logged out from all sessions.',
        });
    } catch (error) {
        clearAuthCookies(res);
        next(error);
    }
}

function me(req, res) {
    res.status(200).json({
        user: req.user,
    });
}

module.exports = {
    forgotPassword,
    google,
    login,
    logout,
    logoutAll,
    me,
    refresh,
    resendOtp,
    resetPassword: resetPasswordController,
    signup,
    verifyEmail,
};
