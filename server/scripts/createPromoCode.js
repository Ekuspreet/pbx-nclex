const { closeDb } = require('../db');
const { createPromoCode } = require('../services/adminPromoCodeService');
const { createPromoCodeSchema } = require('../validators');

function argumentsByName(argv) {
    return Object.fromEntries(argv.filter((value) => value.startsWith('--')).map((value) => {
        const [key, ...parts] = value.slice(2).split('=');
        return [key, parts.join('=')];
    }));
}

async function main() {
    const args = argumentsByName(process.argv.slice(2));
    if (!args.code || !args.discount) {
        throw new Error('Usage: npm run promo:create -- --code=SAVE20 --discount=20 [--max-uses=100] [--expires-at=2026-12-31T23:59:59+05:30]');
    }

    const values = createPromoCodeSchema.parse({
        code: args.code.trim().toUpperCase(),
        discountPercent: Number(args.discount),
        maxRedemptions: args['max-uses'] ? Number(args['max-uses']) : null,
        expiresAt: args['expires-at'] ? new Date(args['expires-at']) : null,
        active: args.active !== 'false',
    });
    const promoCode = await createPromoCode(values);
    console.log(`Created promo code ${promoCode.code}.`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
}).finally(closeDb);
