const { eq } = require('drizzle-orm');

const { db, users } = require('../db');
const { env } = require('../env');
const { toPublicUser, verifyAccessToken } = require('../utils/auth');

function createUnauthorizedError(message = 'Authentication required.') {
    const error = new Error(message);
    error.statusCode = 401;
    error.code = 'AUTH_UNAUTHORIZED';
    return error;
}

async function authenticate(req, res, next) {
    try {
        const accessToken = req.cookies?.[env.ACCESS_COOKIE_NAME];

        if (!accessToken) {
            throw createUnauthorizedError();
        }

        let payload;

        try {
            payload = verifyAccessToken(accessToken);
        } catch (error) {
            throw createUnauthorizedError();
        }

        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                emailVerified: users.emailVerified,
                status: users.status,
            })
            .from(users)
            .where(eq(users.id, payload.sub))
            .limit(1);

        if (!user || user.status !== 'active') {
            throw createUnauthorizedError();
        }

        req.user = toPublicUser(user);
        req.auth = {
            accessTokenId: payload.jti,
        };

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = authenticate;
