const express = require('express');

const referralController = require('../controllers/referralController');
const { referralActivateLimiter } = require('../middleware/rateLimits');

const router = express.Router();

router.get('/summary', referralController.getSummary);
router.post('/activate-free-month', referralActivateLimiter, referralController.activateFreeMonth);

module.exports = router;
