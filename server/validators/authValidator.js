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

const updateProfileSchema = z.object({
    name: z.string().trim().min(2, 'Enter at least 2 characters.').max(100),
    phone: z.union([
        z.string().trim().regex(/^\+?[0-9][0-9\s()-]{6,19}$/, 'Enter a valid contact number.'),
        z.literal(''),
    ]).transform((value) => value || null),
});

const setPasswordSchema = z.object({
    password: passwordSchema,
    confirmPassword: z.string(),
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['confirmPassword'],
            message: 'Passwords must match.',
        });
    }
});

module.exports = {
    forgotPasswordSchema,
    googleSignInSchema,
    resendOtpSchema,
    resetPasswordSchema,
    signupSchema,
    verifyEmailSchema,
    loginSchema,
    setPasswordSchema,
    updateProfileSchema,
};
