
const path = require('path');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { validateDatabaseEnv } = require('../env/database');

async function main() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Database reset is disabled in production.');
    }

    const config = validateDatabaseEnv();
    const database = config.database;
    const host = config.host;
    const confirmation = `reset ${database}`;

    console.log('WARNING: This permanently deletes all database data.');
    console.log(`Target: ${database} on ${host}:${config.port}`);

    const prompt = readline.createInterface({ input: stdin, output: stdout });
    const answer = await prompt.question(`Type "${confirmation}" to continue: `);
    prompt.close();

    if (answer !== confirmation) {
        console.log('Database reset cancelled.');
        process.exitCode = 1;
        return;
    }

    const pool = new Pool(config);

    try {
        await pool.query('DROP SCHEMA public CASCADE');
        await pool.query('CREATE SCHEMA public');
        await pool.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
        await pool.query('GRANT ALL ON SCHEMA public TO public');
        console.log('Database schema reset successfully.');
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error('Database reset failed:', error.message);
    process.exitCode = 1;
});
