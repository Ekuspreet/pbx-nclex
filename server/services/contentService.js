const { and, eq } = require('drizzle-orm');

const { contentEntries, db } = require('../db');
const { createHttpError } = require('./httpError');

async function getPublishedContent(key) {
    const [entry] = await db.select().from(contentEntries).where(and(
        eq(contentEntries.key, key),
        eq(contentEntries.group, 'legal'),
        eq(contentEntries.published, true)
    )).limit(1);
    if (!entry) throw createHttpError(404, 'Content not found.', 'CONTENT_NOT_FOUND');
    return entry;
}

module.exports = { getPublishedContent };
