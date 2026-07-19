const { validateEnv } = require('./env');

async function isDatabaseConnected() {
    const { testConnection } = require('./db');

    try {
        return await testConnection();
    } catch (error) {
        throw new Error('Unable to connect to PostgreSQL.', { cause: error });
    }
}

async function runStartupChecks() {
    validateEnv();

    const connected = await isDatabaseConnected();

    if (!connected) {
        throw new Error('PostgreSQL connection check failed.');
    }
}

module.exports = {
    isDatabaseConnected,
    validateEnv,
    runStartupChecks,
};
