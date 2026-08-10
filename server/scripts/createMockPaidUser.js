const crypto = require('crypto');
const { desc, eq } = require('drizzle-orm');

const { normalizeEmail } = require('../utils/auth/email');

const INFINITE_ACCESS_EXPIRES_AT = new Date('9999-12-31T23:59:59.999Z');
let closeDb;
let db;
let paymentOrders;
let subscriptions;
let users;

function readEmail() {
    const email = normalizeEmail(process.argv[2] || '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Usage: npm run user:mock-paid -- user@example.com');
    }

    return email;
}

function getMockName(email) {
    const localPart = email.split('@')[0].replace(/[._+-]+/g, ' ').trim();
    return localPart || 'Mock Premium User';
}

async function createMockPaidUser(email) {
    return db.transaction(async (transaction) => {
        const now = new Date();
        const [user] = await transaction
            .insert(users)
            .values({
                name: getMockName(email),
                email,
                normalizedEmail: email,
                emailVerified: true,
                emailVerifiedAt: now,
                status: 'active',
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: users.normalizedEmail,
                set: {
                    email,
                    emailVerified: true,
                    emailVerifiedAt: now,
                    status: 'active',
                    updatedAt: now,
                },
            })
            .returning();

        const [existingSubscription] = await transaction
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, user.id))
            .orderBy(desc(subscriptions.expiresAt))
            .limit(1);

        if (existingSubscription) {
            const [subscription] = await transaction
                .update(subscriptions)
                .set({ plan: 'plus', startsAt: now, expiresAt: INFINITE_ACCESS_EXPIRES_AT })
                .where(eq(subscriptions.id, existingSubscription.id))
                .returning();

            return { user, subscription };
        }

        const mockId = crypto.randomUUID();
        const [order] = await transaction
            .insert(paymentOrders)
            .values({
                userId: user.id,
                plan: 'plus',
                amount: 0,
                currency: 'INR',
                razorpayOrderId: `mock_order_${mockId}`,
                razorpayPaymentId: `mock_payment_${mockId}`,
                status: 'paid',
                fulfilledAt: now,
                updatedAt: now,
            })
            .returning();

        const [subscription] = await transaction
            .insert(subscriptions)
            .values({
                userId: user.id,
                paymentOrderId: order.id,
                plan: 'plus',
                startsAt: now,
                expiresAt: INFINITE_ACCESS_EXPIRES_AT,
            })
            .returning();

        return { user, subscription };
    });
}

async function main() {
    const email = readEmail();
    ({ closeDb, db, paymentOrders, subscriptions, users } = require('../db'));
    const result = await createMockPaidUser(email);
    console.info(`Mock paid user ready: ${result.user.email}`);
    console.info(`Plan: ${result.subscription.plan}`);
    console.info(`Access expires: ${result.subscription.expiresAt.toISOString()}`);
}

main()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => closeDb?.());
