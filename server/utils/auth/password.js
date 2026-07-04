const argon2 = require('argon2');

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const PASSWORD_HASH_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
};
const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$njvftGf3EBjUaAhqYk3RnA$s9MUcH3f4K5xD+0Hb4qqAuvQgBTl5wR8/KdCzuJUS94';

function getPasswordPolicyIssues(password) {
    const issues = [];

    if (typeof password !== 'string') {
        return ['Password is required.'];
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        issues.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        issues.push(`Password must be at most ${PASSWORD_MAX_LENGTH} characters.`);
    }

    if (!/[A-Za-z]/.test(password)) {
        issues.push('Password must include at least one letter.');
    }

    if (!/\d/.test(password)) {
        issues.push('Password must include at least one number.');
    }

    return issues;
}

function isPasswordAllowed(password) {
    return getPasswordPolicyIssues(password).length === 0;
}

async function hashPassword(password) {
    return argon2.hash(password, PASSWORD_HASH_OPTIONS);
}

async function verifyPassword(passwordHash, password) {
    if (!passwordHash || !password) {
        return false;
    }

    try {
        return await argon2.verify(passwordHash, password);
    } catch (error) {
        return false;
    }
}

async function verifyPasswordWithFallback(passwordHash, password) {
    const hashToVerify = passwordHash || DUMMY_PASSWORD_HASH;
    const isValid = await verifyPassword(hashToVerify, password);

    return Boolean(passwordHash && isValid);
}

module.exports = {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    getPasswordPolicyIssues,
    hashPassword,
    isPasswordAllowed,
    verifyPassword,
    verifyPasswordWithFallback,
};
