const { and, desc, eq, gt } = require('drizzle-orm');

const { db, subscriptions, users, wallets } = require('../db');
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
                phone: users.phone,
                email: users.email,
                emailVerified: users.emailVerified,
                passwordHash: users.passwordHash,
                status: users.status,
            })
            .from(users)
            .where(eq(users.id, payload.sub))
            .limit(1);

        if (!user || user.status !== 'active') {
            throw createUnauthorizedError();
        }

        const now = new Date();
        const [subscription] = await db
            .select({ plan: subscriptions.plan, expiresAt: subscriptions.expiresAt })
            .from(subscriptions)
            .where(and(eq(subscriptions.userId, user.id), gt(subscriptions.expiresAt, now)))
            .orderBy(desc(subscriptions.expiresAt))
            .limit(1);

        const [wallet] = await db
            .select({ bankedFreeMonths: wallets.bankedFreeMonths })
            .from(wallets)
            .where(eq(wallets.userId, user.id))
            .limit(1);

        req.user = toPublicUser({
            ...user,
            plan: subscription?.plan || 'free',
            subscriptionExpiresAt: subscription?.expiresAt || null,
            bankedFreeMonths: wallet?.bankedFreeMonths || 0,
        });
        req.auth = {
            accessTokenId: payload.jti,
        };

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = authenticate;
