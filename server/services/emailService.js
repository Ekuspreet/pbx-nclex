const nodemailer = require('nodemailer');

const { env } = require('../env');

let mailTransporter;

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getFromAddress() {
    return {
        name: env.EMAIL_FROM_NAME,
        address: env.EMAIL_FROM || env.GOOGLE_MAIL_USER || 'no-reply@example.com',
    };
}

function getMailTransporter() {
    if (!mailTransporter) {
        mailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: env.GOOGLE_MAIL_USER,
                clientId: env.GOOGLE_MAIL_CLIENT_ID,
                clientSecret: env.GOOGLE_MAIL_CLIENT_SECRET,
                refreshToken: env.GOOGLE_MAIL_REFRESH_TOKEN,
            },
        });
    }

    return mailTransporter;
}

function redactKnownSecrets(value) {
    let text = String(value);

    for (const secret of [
        env.GOOGLE_MAIL_CLIENT_SECRET,
        env.GOOGLE_MAIL_REFRESH_TOKEN,
    ]) {
        if (secret && secret.length > 6) {
            text = text.split(secret).join('[redacted]');
        }
    }

    return text;
}

function getSafeErrorText(value) {
    if (!value) {
        return undefined;
    }

    return redactKnownSecrets(value).slice(0, 500);
}

function getDeliveryFailureHint(error) {
    if (env.EMAIL_PROVIDER !== 'gmail' || error.code !== 'EAUTH') {
        return undefined;
    }

    if (error.command === 'AUTH XOAUTH2') {
        return 'Gmail OAuth2 authentication failed. Check that GOOGLE_MAIL_USER is the full mailbox that authorized the refresh token, and that the refresh token was generated with the same OAuth client id/secret and mail scope.';
    }

    return 'Gmail authentication failed. Check the configured Gmail credentials.';
}

function getSafeDeliveryFailureLog(error) {
    const log = {
        provider: env.EMAIL_PROVIDER,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
    };
    const message = getSafeErrorText(error.message);
    const response = getSafeErrorText(error.response);
    const hint = getDeliveryFailureHint(error);

    if (message) {
        log.message = message;
    }

    if (response) {
        log.response = response;
    }

    if (hint) {
        log.hint = hint;
    }

    return log;
}

function createEmailDeliveryError(cause) {
    const error = new Error('Unable to send email. Please try again.');
    error.statusCode = 503;
    error.code = 'EMAIL_DELIVERY_FAILED';
    error.cause = cause;

    return error;
}

async function sendEmail({ to, subject, text, html }) {
    const message = {
        from: getFromAddress(),
        to,
        subject,
        text,
        html,
    };

    if (env.EMAIL_PROVIDER === 'console') {
        console.info('[development email: not sent]');
        console.info(`From: ${message.from.name} <${message.from.address}>`);
        console.info(`To: ${message.to}`);
        console.info(`Subject: ${message.subject}`);
        console.info(message.text);

        return {
            provider: 'console',
            accepted: [to],
        };
    }

    if (env.EMAIL_PROVIDER === 'gmail') {
        try {
            const result = await getMailTransporter().sendMail(message);

            return {
                provider: 'gmail',
                messageId: result.messageId,
                accepted: result.accepted || [to],
                rejected: result.rejected || [],
            };
        } catch (error) {
            console.error('Email delivery failed.', getSafeDeliveryFailureLog(error));

            throw createEmailDeliveryError(error);
        }
    }

    const error = new Error('Email provider is not configured.');
    error.statusCode = 503;
    error.code = 'EMAIL_PROVIDER_NOT_CONFIGURED';
    throw error;
}

async function sendEmailVerificationOtp({ to, name, otp }) {
    const safeName = name ? escapeHtml(name) : 'there';
    const subject = `${env.APP_NAME} verification code`;
    const text = [
        `Hi ${name || 'there'},`,
        '',
        `Your ${env.APP_NAME} verification code is ${otp}.`,
        `It expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes.`,
        '',
        'If you did not request this code, you can ignore this email.',
    ].join('\n');
    const html = [
        `<p>Hi ${safeName},</p>`,
        `<p>Your ${escapeHtml(env.APP_NAME)} verification code is <strong>${escapeHtml(otp)}</strong>.</p>`,
        `<p>It expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes.</p>`,
        '<p>If you did not request this code, you can ignore this email.</p>',
    ].join('');

    return sendEmail({
        to,
        subject,
        text,
        html,
    });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
    const safeName = name ? escapeHtml(name) : 'there';
    const safeResetUrl = escapeHtml(resetUrl);
    const subject = `${env.APP_NAME} password reset`;
    const text = [
        `Hi ${name || 'there'},`,
        '',
        `Reset your ${env.APP_NAME} password using this link:`,
        resetUrl,
        '',
        `This link expires in ${env.PASSWORD_RESET_EXPIRES_IN_MINUTES} minutes.`,
        '',
        'If you did not request a password reset, you can ignore this email.',
    ].join('\n');
    const html = [
        `<p>Hi ${safeName},</p>`,
        `<p>Reset your ${escapeHtml(env.APP_NAME)} password using this link:</p>`,
        `<p><a href="${safeResetUrl}">${safeResetUrl}</a></p>`,
        `<p>This link expires in ${env.PASSWORD_RESET_EXPIRES_IN_MINUTES} minutes.</p>`,
        '<p>If you did not request a password reset, you can ignore this email.</p>',
    ].join('');

    return sendEmail({
        to,
        subject,
        text,
        html,
    });
}

module.exports = {
    sendEmail,
    sendEmailVerificationOtp,
    sendPasswordResetEmail,
};
