const { getPublicPlans } = require('../services/planCatalog');

function index(req, res) {
    res.status(200).json({ plans: getPublicPlans() });
}

module.exports = { index };
