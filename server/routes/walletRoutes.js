const express = require('express');

const walletController = require('../controllers/walletController');

const router = express.Router();

router.get('/ledger', walletController.getLedger);

module.exports = router;
