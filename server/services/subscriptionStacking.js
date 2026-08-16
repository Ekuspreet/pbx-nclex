const { and, desc, eq, gt } = require('drizzle-orm');

const { subscriptions } = require('../db');

async function computeStackedWindow(tx, userId, durationDays, now) {
    const [latest] = await tx
        .select({ expiresAt: subscriptions.expiresAt })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), gt(subscriptions.expiresAt, now)))
        .orderBy(desc(subscriptions.expiresAt))
        .limit(1);

    const startsAt = latest?.expiresAt || now;
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return { startsAt, expiresAt };
}

module.exports = { computeStackedWindow };
