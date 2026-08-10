const { runStartupChecks } = require('./startup');
const { closeDb } = require('./db');
const { startServer } = require('./server');

async function startApplication() {
    const { env } = require('./env');

    if (!env.MAINTENANCE) {
        await runStartupChecks();
    } else {
        console.log('Maintenance mode enabled; database startup checks are skipped.');
    }
    const server = startServer();
    let shuttingDown = false;

    async function shutdown(signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`${signal} received; shutting down.`);

        const forceExit = setTimeout(() => {
            console.error('Graceful shutdown timed out.');
            process.exit(1);
        }, 10_000);
        forceExit.unref();

        server.close(async (error) => {
            try {
                await closeDb();
                process.exit(error ? 1 : 0);
            } catch (closeError) {
                console.error('Database shutdown failed:', closeError);
                process.exit(1);
            }
        });
    }

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
}

startApplication().catch((error) => {
    console.error('Application startup failed:', error);
    process.exitCode = 1;
});
