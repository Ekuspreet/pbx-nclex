const { getDashboard } = require('../services/testService');

async function dashboard(req, res, next) {
    try {
        const payload = await getDashboard(req.user.id, req.user.plan);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

module.exports = dashboard;
