require('dotenv').config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for Drizzle Kit');
}

module.exports = {
    schema: './models/index.js',
    out: './db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    strict: true,
    verbose: true,
};
