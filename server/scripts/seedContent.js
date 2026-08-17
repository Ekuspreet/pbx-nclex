const fs = require('fs/promises');
const path = require('path');
const { ne } = require('drizzle-orm');

const { closeDb, contentEntries, db } = require('../db');

const policyRoot = path.resolve(__dirname, '../policy');
const legalFiles = {
    'legal.terms': 'terms_and_conditions.md',
    'legal.privacy': 'privacy.md',
    'legal.refunds': 'return_and_refund.md',
    'legal.cancellation': 'cancellation.md',
    'legal.disclaimer': 'disclaimer.md',
};

async function buildEntries() {
    const entries = [];
    for (const [key, filename] of Object.entries(legalFiles)) {
        entries.push({ key, group: 'legal', content: { markdown: await fs.readFile(path.join(policyRoot, filename), 'utf8') }, effectiveAt: new Date() });
    }
    return entries;
}

async function seedContent() {
    const entries = await buildEntries();
    await db.delete(contentEntries).where(ne(contentEntries.group, 'legal'));
    for (const entry of entries) {
        await db.insert(contentEntries).values(entry).onConflictDoUpdate({
            target: contentEntries.key,
            set: { group: entry.group, content: entry.content, published: true, effectiveAt: entry.effectiveAt || null, updatedAt: new Date() },
        });
    }
    console.log(`Seeded ${entries.length} legal policy entries and removed non-policy content.`);
}

seedContent().then(closeDb).catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
});
