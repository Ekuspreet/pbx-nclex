const { and, desc, eq } = require('drizzle-orm');

const { db, discountCodes } = require('../db');
const { createHttpError } = require('./httpError');

const UNIQUE_VIOLATION = '23505';

function mapWriteError(error) {
    if (error.code === UNIQUE_VIOLATION) {
        throw createHttpError(409, 'A discount code with this value already exists.', 'PROMO_CODE_DUPLICATE');
    }
    throw error;
}

async function listPromoCodes() {
    return db.select().from(discountCodes)
        .where(eq(discountCodes.type, 'promo'))
        .orderBy(desc(discountCodes.createdAt));
}

async function createPromoCode(values, database = db) {
    try {
        const [promoCode] = await database.insert(discountCodes).values({
            ...values,
            code: values.code.toUpperCase(),
            type: 'promo',
            ownerUserId: null,
        }).returning();
        return promoCode;
    } catch (error) {
        return mapWriteError(error);
    }
}

async function updatePromoCode(id, values) {
    try {
        const [promoCode] = await db.update(discountCodes).set({
            ...values,
            ...(values.code ? { code: values.code.toUpperCase() } : {}),
            updatedAt: new Date(),
        }).where(and(eq(discountCodes.id, id), eq(discountCodes.type, 'promo'))).returning();

        if (!promoCode) {
            throw createHttpError(404, 'Promo code not found.', 'PROMO_CODE_NOT_FOUND');
        }
        return promoCode;
    } catch (error) {
        return mapWriteError(error);
    }
}

module.exports = { createPromoCode, listPromoCodes, updatePromoCode };
