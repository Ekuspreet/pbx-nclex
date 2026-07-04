const { env } = require('../env');
const { verifyAdminToken } = require('../services/adminAuthService');

function createUnauthorizedError() {
    const error = new Error('Admin authentication required.');
    error.statusCode = 401;
    error.code = 'ADMIN_AUTH_UNAUTHORIZED';
    return error;
}

function authenticateAdmin(req, res, next) {
    try {
        const token = req.cookies?.[env.ADMIN_COOKIE_NAME];

        if (!token) {
            throw createUnauthorizedError();
        }

        const payload = verifyAdminToken(token);

        req.admin = {
            username: payload.sub,
        };

        next();
    } catch (error) {
        next(createUnauthorizedError());
    }
}

module.exports = authenticateAdmin;
