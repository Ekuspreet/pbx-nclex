const { validateEnv } = require('./env');

// Startup scripts that run during application boot can be added here.
function ingestQuestionsInDatabase() {

}

function runStartupChecks() {
    validateEnv();
}

module.exports = {
    validateEnv,
    runStartupChecks,
};
