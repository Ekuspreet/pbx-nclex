function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        phone: user.phone || null,
        email: user.email,
        emailVerified: user.emailVerified,
        hasPassword: Boolean(user.passwordHash),
        status: user.status,
        plan: user.plan || 'free',
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        bankedFreeMonths: user.bankedFreeMonths || 0,
    };
}

module.exports = {
    toPublicUser,
};
