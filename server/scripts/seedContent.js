const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');

const { closeDb, contentEntries, db } = require('../db');

const clientRoot = path.resolve(__dirname, '../../client/src');
const legalFiles = {
    'legal.terms': 'terms_and_conditions.md',
    'legal.privacy': 'privacy.md',
    'legal.refunds': 'return_and_refund.md',
    'legal.cancellation': 'cancellation.md',
    'legal.disclaimer': 'disclaimer.md',
};

async function importClientModule(relativePath) {
    return import(pathToFileURL(path.join(clientRoot, relativePath)).href);
}

async function buildEntries() {
    const [{ hero }, { features }, { pricing }, { callToAction }, { business }] = await Promise.all([
        importClientModule('content/landing/hero.js'),
        importClientModule('content/landing/features.js'),
        importClientModule('content/landing/pricing.js'),
        importClientModule('content/landing/callToAction.js'),
        importClientModule('content/business.js'),
    ]);
    const entries = [
        { key: 'site.hero', group: 'site', content: hero },
        { key: 'site.features', group: 'site', content: features },
        { key: 'site.pricing', group: 'site', content: pricing },
        { key: 'site.callToAction', group: 'site', content: callToAction },
        { key: 'site.business', group: 'site', content: business },
    ];
    for (const [key, filename] of Object.entries(legalFiles)) {
        entries.push({ key, group: 'legal', content: { markdown: await fs.readFile(path.join(clientRoot, 'policy', filename), 'utf8') }, effectiveAt: new Date() });
    }
    return entries;
}

async function seedContent() {
    const entries = await buildEntries();
    for (const entry of entries) {
        await db.insert(contentEntries).values(entry).onConflictDoUpdate({
            target: contentEntries.key,
            set: { group: entry.group, content: entry.content, published: true, effectiveAt: entry.effectiveAt || null, updatedAt: new Date() },
        });
    }
    console.log(`Seeded ${entries.length} content entries.`);
}

seedContent().then(closeDb).catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
});
