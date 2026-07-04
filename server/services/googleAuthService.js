const { OAuth2Client } = require('google-auth-library');

const { env } = require('../env');

let googleClient;

function getGoogleClient() {
    if (!env.GOOGLE_CLIENT_ID) {
        const error = new Error('Google Sign-In is not configured.');
        error.statusCode = 503;
        error.code = 'AUTH_GOOGLE_NOT_CONFIGURED';
        throw error;
    }

    if (!googleClient) {
        googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    }

    return googleClient;
}

function createGoogleAuthError() {
    const error = new Error('Invalid Google credential.');
    error.statusCode = 401;
    error.code = 'AUTH_GOOGLE_INVALID';
    return error;
}

async function verifyGoogleCredential(credential) {
    let ticket;

    try {
        ticket = await getGoogleClient().verifyIdToken({
            idToken: credential,
            audience: env.GOOGLE_CLIENT_ID,
        });
    } catch (error) {
        throw createGoogleAuthError();
    }

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw createGoogleAuthError();
    }

    return {
        subject: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
    };
}

module.exports = {
    verifyGoogleCredential,
};
