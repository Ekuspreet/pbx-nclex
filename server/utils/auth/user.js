function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        status: user.status,
    };
}

module.exports = {
    toPublicUser,
};
