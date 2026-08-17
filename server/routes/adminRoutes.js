const express = require('express');

const adminController = require('../controllers/adminController');
const adminOperationsController = require('../controllers/adminOperationsController');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const { adminLoginLimiter } = require('../middleware/rateLimits');
const validate = require('../middleware/validate');
const {
    adminLoginSchema,
    feedbackIdParamSchema,
    paginationQuerySchema,
    questionIdParamSchema,
    replyFeedbackSchema,
    updateFeedbackStatusSchema,
    createPromoCodeSchema,
    promoCodeIdParamSchema,
    updatePromoCodeSchema,
} = require('../validators');

const router = express.Router();

router.post('/auth/login', adminLoginLimiter, validate({ body: adminLoginSchema }), adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/me', authenticateAdmin, adminController.me);
router.get('/dashboard', authenticateAdmin, adminOperationsController.dashboard);
router.get('/subscriptions', authenticateAdmin, validate({ query: paginationQuerySchema }), adminOperationsController.listSubscriptions);
router.get('/payments', authenticateAdmin, validate({ query: paginationQuerySchema }), adminOperationsController.listPayments);
router.get('/referrals', authenticateAdmin, validate({ query: paginationQuerySchema }), adminOperationsController.listReferrals);
router.get('/configuration', authenticateAdmin, adminOperationsController.configuration);
router.get('/users', authenticateAdmin, validate({ query: paginationQuerySchema }), adminController.listUsers);
router.get('/questions', authenticateAdmin, validate({ query: paginationQuerySchema }), adminController.listQuestions);
router.get('/questions/:questionId', authenticateAdmin, validate({ params: questionIdParamSchema }), adminController.showQuestion);
router.get('/feedback', authenticateAdmin, validate({ query: paginationQuerySchema }), adminController.listFeedback);
router.get('/feedback/:feedbackId', authenticateAdmin, validate({ params: feedbackIdParamSchema }), adminController.showFeedback);
router.post('/feedback/:feedbackId/reply', authenticateAdmin, validate({ params: feedbackIdParamSchema, body: replyFeedbackSchema }), adminController.replyFeedback);
router.patch('/feedback/:feedbackId/status', authenticateAdmin, validate({ params: feedbackIdParamSchema, body: updateFeedbackStatusSchema }), adminController.feedbackStatus);
router.get('/promo-codes', authenticateAdmin, adminController.promoCodes);
router.post('/promo-codes', authenticateAdmin, validate({ body: createPromoCodeSchema }), adminController.createPromo);
router.patch('/promo-codes/:promoCodeId', authenticateAdmin, validate({ params: promoCodeIdParamSchema, body: updatePromoCodeSchema }), adminController.updatePromo);

module.exports = router;
