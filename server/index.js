const { runStartupChecks } = require('./startup');
const { startServer } = require('./server');

runStartupChecks();
startServer();
