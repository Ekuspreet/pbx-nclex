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
    };
}

module.exports = {
    toPublicUser,
};
