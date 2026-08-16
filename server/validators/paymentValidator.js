const { z } = require('zod');

const createOrderSchema = z.object({
    plan: z.string().trim().min(1).max(40),
    code: z.string().trim().min(1).max(20).optional(),
    redeemCoins: z.boolean().optional(),
});

const previewCodeSchema = z.object({
    plan: z.string().trim().min(1).max(40),
    code: z.string().trim().min(1).max(20),
});

module.exports = { createOrderSchema, previewCodeSchema };
