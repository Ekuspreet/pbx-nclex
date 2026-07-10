const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

const { validateDatabaseEnv } = require('../env/database');
const schema = require('../models');

const pool = new Pool(validateDatabaseEnv());

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
