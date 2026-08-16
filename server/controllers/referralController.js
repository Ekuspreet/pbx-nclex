const { activateBankedFreeMonth, getReferralSummary } = require('../services/referralService');

async function getSummary(req, res, next) {
    try {
        const summary = await getReferralSummary(req.user.id);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
}

async function activateFreeMonth(req, res, next) {
    try {
        const subscription = await activateBankedFreeMonth(req.user.id);
        res.status(200).json({ subscription });
    } catch (error) {
        next(error);
    }
}

module.exports = { activateFreeMonth, getSummary };
