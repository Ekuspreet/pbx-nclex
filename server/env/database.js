function readDatabaseEnv(source = process.env) {
    return {
        host: source.POSTGRES_HOST || 'localhost',
        port: Number(source.POSTGRES_PORT || 5432),
        database: source.POSTGRES_DB,
        user: source.POSTGRES_USER,
        password: source.POSTGRES_PASSWORD,
    };
}

function validateDatabaseEnv(config = readDatabaseEnv()) {
    const missing = [];

    if (!config.database) missing.push('POSTGRES_DB');
    if (!config.user) missing.push('POSTGRES_USER');
    if (!config.password) missing.push('POSTGRES_PASSWORD');

    if (missing.length > 0) {
        throw new Error(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required to connect to PostgreSQL.`);
    }

    return config;
}

function buildDatabaseUrl(config = validateDatabaseEnv()) {
    const user = encodeURIComponent(config.user);
    const password = encodeURIComponent(config.password);
    const database = encodeURIComponent(config.database);

    return `postgres://${user}:${password}@${config.host}:${config.port}/${database}`;
}

module.exports = {
    buildDatabaseUrl,
    readDatabaseEnv,
    validateDatabaseEnv,
};
