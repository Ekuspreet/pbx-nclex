require('dotenv').config();

const { buildDatabaseUrl } = require('./env/database');

module.exports = {
    schema: './models/index.js',
    out: './db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || buildDatabaseUrl(),
    },
    strict: true,
    verbose: true,
};
