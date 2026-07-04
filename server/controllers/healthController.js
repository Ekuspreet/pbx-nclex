function healthController(req, res) {
    res.status(200).json({
        status: 'ok',
        message: 'API is healthy',
    });
}

module.exports = healthController;
