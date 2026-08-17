const { z } = require('zod');

const codeSchema = z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9_-]+$/, 'Use only letters, numbers, hyphens, and underscores.');
const expiresAtSchema = z.iso.datetime({ offset: true }).transform((value) => new Date(value)).nullable();

const createPromoCodeSchema = z.object({
    code: codeSchema,
    discountPercent: z.number().int().min(1).max(100),
    maxRedemptions: z.number().int().positive().nullable().default(null),
    expiresAt: expiresAtSchema.default(null),
    active: z.boolean().default(true),
}).strict();

const updatePromoCodeSchema = z.object({
    code: codeSchema.optional(),
    discountPercent: z.number().int().min(1).max(100).optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
    expiresAt: expiresAtSchema.optional(),
    active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

const promoCodeIdParamSchema = z.object({ promoCodeId: z.string().uuid() });

module.exports = { createPromoCodeSchema, promoCodeIdParamSchema, updatePromoCodeSchema };
