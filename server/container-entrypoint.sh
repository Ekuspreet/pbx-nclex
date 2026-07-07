#!/bin/sh
set -eu

node <<'NODE'
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS || 30);
const waitMs = Number(process.env.DB_WAIT_MS || 2000);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase() {
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required.');
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const client = new Client({ connectionString: databaseUrl });

        try {
            await client.connect();
            await client.query('select 1');
            await client.end();
            console.log('Database is ready.');
            return;
        } catch (error) {
            try {
                await client.end();
            } catch {}

            if (attempt === maxAttempts) {
                throw error;
            }

            console.log(`Waiting for database (${attempt}/${maxAttempts})...`);
            await sleep(waitMs);
        }
    }
}

waitForDatabase().catch((error) => {
    console.error(error);
    process.exit(1);
});
NODE

npm run db:migrate

exec "$@"
