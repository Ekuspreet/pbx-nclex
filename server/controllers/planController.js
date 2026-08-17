const { getPublicPlans } = require('../services/planCatalog');

async function index(req, res, next) {
    try {
        res.status(200).json({ plans: await getPublicPlans() });
    } catch (error) {
        next(error);
    }
}

module.exports = { index };
