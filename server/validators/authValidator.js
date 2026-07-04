const { z } = require('zod');

const { PASSWORD_MAX_LENGTH, getPasswordPolicyIssues } = require('../utils/auth/password');

const passwordSchema = z.string().superRefine((password, ctx) => {
    for (const message of getPasswordPolicyIssues(password)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
        });
    }
});

const signupSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(320),
    password: passwordSchema,
});

const verifyEmailSchema = z.object({
    email: z.string().trim().email().max(320),
    otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit verification code.'),
});

const resendOtpSchema = z.object({
    email: z.string().trim().email().max(320),
});

const googleSignInSchema = z.object({
    credential: z.string().trim().min(1),
});

const forgotPasswordSchema = z.object({
    email: z.string().trim().email().max(320),
});

const resetPasswordSchema = z.object({
    token: z.string().trim().min(32).max(512),
    password: passwordSchema,
});

const loginSchema = z.object({
    email: z.string().trim().email().max(320),
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

module.exports = {
    forgotPasswordSchema,
    googleSignInSchema,
    resendOtpSchema,
    resetPasswordSchema,
    signupSchema,
    verifyEmailSchema,
    loginSchema,
};
