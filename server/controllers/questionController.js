const { getQuestionStats } = require('../services/questionBankService');

async function stats(req, res, next) {
    try {
        const payload = await getQuestionStats();
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    stats,
};
