function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    const payload = {
        message: statusCode >= 500 && isProduction
            ? 'Internal server error'
            : err.message || 'Internal server error',
    };

    if (err.details) {
        payload.details = err.details;
    }

    res.status(statusCode).json(payload);
}

module.exports = errorHandler;
