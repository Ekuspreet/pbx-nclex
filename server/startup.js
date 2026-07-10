const { validateEnv } = require('./env');

function runStartupChecks() {
    validateEnv();
}

module.exports = {
    validateEnv,
    runStartupChecks,
};
