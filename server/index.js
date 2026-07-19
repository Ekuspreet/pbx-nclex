const { runStartupChecks } = require('./startup');
const { startServer } = require('./server');

async function startApplication() {
    await runStartupChecks();
    startServer();
}

startApplication().catch((error) => {
    console.error('Application startup failed:', error);
    process.exitCode = 1;
});
