const { and, asc, eq } = require('drizzle-orm');

const { contentEntries, db } = require('../db');
const { createHttpError } = require('./httpError');

async function getPublishedContent(key) {
    const [entry] = await db.select().from(contentEntries).where(and(
        eq(contentEntries.key, key),
        eq(contentEntries.published, true)
    )).limit(1);
    if (!entry) throw createHttpError(404, 'Content not found.', 'CONTENT_NOT_FOUND');
    return entry;
}

async function listPublishedContent(group) {
    const rows = await db.select().from(contentEntries).where(and(
        eq(contentEntries.group, group),
        eq(contentEntries.published, true)
    )).orderBy(asc(contentEntries.key));
    return Object.fromEntries(rows.map((row) => [row.key, row.content]));
}

module.exports = { getPublishedContent, listPublishedContent };
