const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

const schema = require('../models');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to connect to PostgreSQL');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function testConnection() {
    const result = await pool.query('select 1 as ok');
    return result.rows[0]?.ok === 1;
}

async function closeDb() {
    await pool.end();
}

module.exports = {
    db,
    pool,
    testConnection,
    closeDb,
    ...schema,
};
