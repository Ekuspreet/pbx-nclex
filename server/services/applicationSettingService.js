const { eq } = require('drizzle-orm');

const { applicationSettings, db } = require('../db');

async function getSetting(key, database = db) {
    const [setting] = await database
        .select()
        .from(applicationSettings)
        .where(eq(applicationSettings.key, key))
        .limit(1);

    if (!setting) {
        throw new Error(`Required application setting "${key}" is missing. Run the database seed scripts.`);
    }

    return setting.value;
}

async function getNumberSetting(key, database = db) {
    const value = await getSetting(key, database);
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Application setting "${key}" must be a number.`);
    }
    return value;
}

async function getStringSetting(key, database = db) {
    const value = await getSetting(key, database);
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Application setting "${key}" must be a non-empty string.`);
    }
    return value;
}

module.exports = { getSetting, getNumberSetting, getStringSetting };
