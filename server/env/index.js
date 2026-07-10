const dotenv = require('dotenv');
const { readDatabaseEnv } = require('./database');

dotenv.config();

const databaseEnv = readDatabaseEnv();

function readEnv(key, defaultValue = undefined) {
    const value = process.env[key];

    if (value === undefined || value === '') {
        return defaultValue;
    }

    return value;
}

function isSingleEmailAddress(value) {
    return /^[^\s@]+@[^\s@]+$/.test(String(value).trim());
}

const env = {
    NODE_ENV: readEnv('NODE_ENV', 'development'),
    PORT: readEnv('PORT', '5000'),
    POSTGRES_HOST: databaseEnv.host,
    POSTGRES_PORT: databaseEnv.port,
    POSTGRES_DB: databaseEnv.database,
    POSTGRES_USER: databaseEnv.user,
    POSTGRES_PASSWORD: databaseEnv.password,

    CLIENT_URL: readEnv('CLIENT_URL', 'http://localhost:5173'),
    SERVER_URL: readEnv('SERVER_URL', 'http://localhost:5000'),

    ACCESS_TOKEN_SECRET: readEnv('ACCESS_TOKEN_SECRET'),
    ACCESS_TOKEN_EXPIRES_IN: readEnv('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    REFRESH_TOKEN_SECRET: readEnv('REFRESH_TOKEN_SECRET'),
    REFRESH_TOKEN_EXPIRES_IN: readEnv('REFRESH_TOKEN_EXPIRES_IN', '30d'),

    ACCESS_COOKIE_NAME: readEnv('ACCESS_COOKIE_NAME', 'access_token'),
    REFRESH_COOKIE_NAME: readEnv('REFRESH_COOKIE_NAME', 'refresh_token'),
    COOKIE_SECURE: readEnv('COOKIE_SECURE', 'false'),
    COOKIE_SAME_SITE: readEnv('COOKIE_SAME_SITE', 'lax'),
    COOKIE_DOMAIN: readEnv('COOKIE_DOMAIN'),

    OTP_EXPIRES_IN_MINUTES: readEnv('OTP_EXPIRES_IN_MINUTES', '10'),
    OTP_RESEND_COOLDOWN_SECONDS: readEnv('OTP_RESEND_COOLDOWN_SECONDS', '60'),
    OTP_MAX_ATTEMPTS: readEnv('OTP_MAX_ATTEMPTS', '5'),

    PASSWORD_RESET_EXPIRES_IN_MINUTES: readEnv('PASSWORD_RESET_EXPIRES_IN_MINUTES', '15'),

    GOOGLE_CLIENT_ID: readEnv('GOOGLE_CLIENT_ID'),

    ADMIN_USERNAME: readEnv('ADMIN_USERNAME', 'admin'),
    ADMIN_PASSWORD: readEnv('ADMIN_PASSWORD'),
    ADMIN_TOKEN_SECRET: readEnv('ADMIN_TOKEN_SECRET'),
    ADMIN_COOKIE_NAME: readEnv('ADMIN_COOKIE_NAME', 'admin_access_token'),
    ADMIN_TOKEN_EXPIRES_IN: readEnv('ADMIN_TOKEN_EXPIRES_IN', '12h'),

    EMAIL_PROVIDER: readEnv('EMAIL_PROVIDER', 'console'),
    EMAIL_FROM: readEnv('EMAIL_FROM'),
    EMAIL_FROM_NAME: readEnv('EMAIL_FROM_NAME', 'PBX Nursing'),
    GOOGLE_MAIL_USER: readEnv('GOOGLE_MAIL_USER'),
    GOOGLE_MAIL_CLIENT_ID: readEnv('GOOGLE_MAIL_CLIENT_ID'),
    GOOGLE_MAIL_CLIENT_SECRET: readEnv('GOOGLE_MAIL_CLIENT_SECRET'),
    GOOGLE_MAIL_REFRESH_TOKEN: readEnv('GOOGLE_MAIL_REFRESH_TOKEN'),

    APP_NAME: readEnv('APP_NAME', 'PBX Nursing'),
};

function validateEnv() {
    const errors = [];
    const supportedEmailProviders = new Set(['console', 'gmail']);

    for (const key of ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']) {
        if (!env[key]) {
            errors.push(`${key} is required to connect to PostgreSQL.`);
        }
    }

    if (!supportedEmailProviders.has(env.EMAIL_PROVIDER)) {
        errors.push('EMAIL_PROVIDER must be either "console" or "gmail".');
    }

    if (env.NODE_ENV === 'production' && env.EMAIL_PROVIDER === 'console') {
        errors.push('EMAIL_PROVIDER=console is only for local development.');
    }

    if (env.EMAIL_FROM && !isSingleEmailAddress(env.EMAIL_FROM)) {
        errors.push('EMAIL_FROM must be a single email address. Put display names in EMAIL_FROM_NAME.');
    }

    if (env.EMAIL_PROVIDER === 'gmail') {
        for (const key of [
            'GOOGLE_MAIL_USER',
            'GOOGLE_MAIL_CLIENT_ID',
            'GOOGLE_MAIL_CLIENT_SECRET',
            'GOOGLE_MAIL_REFRESH_TOKEN',
        ]) {
            if (!env[key]) {
                errors.push(`${key} is required when EMAIL_PROVIDER=gmail.`);
            }
        }

    if (env.GOOGLE_MAIL_USER && !isSingleEmailAddress(env.GOOGLE_MAIL_USER)) {
            errors.push('GOOGLE_MAIL_USER must be the full Gmail or Google Workspace email address that authorized GOOGLE_MAIL_REFRESH_TOKEN.');
        }
    }

    if (env.NODE_ENV === 'production') {
        if (!env.ADMIN_PASSWORD) {
            errors.push('ADMIN_PASSWORD is required in production.');
        }

        if (!env.ADMIN_TOKEN_SECRET) {
            errors.push('ADMIN_TOKEN_SECRET is required in production.');
        }
    }

    if (errors.length > 0) {
        throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
    }

    return env;
}

module.exports = {
    env,
    validateEnv,
};
