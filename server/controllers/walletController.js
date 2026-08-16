const { listLedgerHistory } = require('../services/walletService');

async function getLedger(req, res, next) {
    try {
        res.status(200).json({ entries: await listLedgerHistory(req.user.id) });
    } catch (error) {
        next(error);
    }
}

module.exports = { getLedger };
