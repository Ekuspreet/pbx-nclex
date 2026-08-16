const express = require('express');

const paymentController = require('../controllers/paymentController');
const { codePreviewLimiter, paymentOrderLimiter, paymentVerifyLimiter } = require('../middleware/rateLimits');
const validate = require('../middleware/validate');
const { createOrderSchema, previewCodeSchema } = require('../validators');

const router = express.Router();

router.get('/history', paymentController.history);
router.post('/create-order', paymentOrderLimiter, validate({ body: createOrderSchema }), paymentController.createOrder);
router.post('/preview-code', codePreviewLimiter, validate({ body: previewCodeSchema }), paymentController.checkCode);
router.post('/verify-payment', paymentVerifyLimiter, paymentController.verifyPayment);

module.exports = router;
