const { env } = require('../../env');
const { durationToMilliseconds } = require('./duration');

const ACCESS_COOKIE_PATH = '/api/v1';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function baseCookieOptions(path) {
    const options = {
        httpOnly: true,
        secure: env.COOKIE_SECURE === 'true',
        sameSite: env.COOKIE_SAME_SITE,
        path,
    };

    if (env.COOKIE_DOMAIN) {
        options.domain = env.COOKIE_DOMAIN;
    }

    return options;
}

function accessCookieOptions() {
    return {
        ...baseCookieOptions(ACCESS_COOKIE_PATH),
        maxAge: durationToMilliseconds(env.ACCESS_TOKEN_EXPIRES_IN),
    };
}

function refreshCookieOptions() {
    return {
        ...baseCookieOptions(REFRESH_COOKIE_PATH),
        maxAge: durationToMilliseconds(env.REFRESH_TOKEN_EXPIRES_IN),
    };
}

function clearAccessCookieOptions() {
    return baseCookieOptions(ACCESS_COOKIE_PATH);
}

function clearRefreshCookieOptions() {
    return baseCookieOptions(REFRESH_COOKIE_PATH);
}

function setAuthCookies(res, tokens) {
    res.cookie(env.ACCESS_COOKIE_NAME, tokens.accessToken, accessCookieOptions());
    res.cookie(env.REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
}

function clearAuthCookies(res) {
    res.clearCookie(env.ACCESS_COOKIE_NAME, clearAccessCookieOptions());
    res.clearCookie(env.REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
}

module.exports = {
    accessCookieOptions,
    clearAccessCookieOptions,
    clearAuthCookies,
    clearRefreshCookieOptions,
    refreshCookieOptions,
    setAuthCookies,
};
