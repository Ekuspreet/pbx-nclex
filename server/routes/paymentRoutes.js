const express = require('express');

const paymentController = require('../controllers/paymentController');
const { paymentOrderLimiter, paymentVerifyLimiter } = require('../middleware/rateLimits');

const router = express.Router();

router.get('/history', paymentController.history);
router.post('/create-order', paymentOrderLimiter, paymentController.createOrder);
router.post('/verify-payment', paymentVerifyLimiter, paymentController.verifyPayment);

module.exports = router;
