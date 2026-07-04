const express = require('express');

const adminController = require('../controllers/adminController');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const validate = require('../middleware/validate');
const {
    adminLoginSchema,
    feedbackIdParamSchema,
    paginationQuerySchema,
    replyFeedbackSchema,
    updateFeedbackStatusSchema,
} = require('../validators');

const router = express.Router();

router.post('/auth/login', validate({ body: adminLoginSchema }), adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/me', authenticateAdmin, adminController.me);
router.get('/dashboard', authenticateAdmin, adminController.dashboard);
router.get('/users', authenticateAdmin, validate({ query: paginationQuerySchema }), adminController.listUsers);
router.get('/questions', authenticateAdmin, validate({ query: paginationQuerySchema }), adminController.listQuestions);
router.get('/feedback', authenticateAdmin, validate({ query: paginationQuerySchema }), adminController.listFeedback);
router.get('/feedback/:feedbackId', authenticateAdmin, validate({ params: feedbackIdParamSchema }), adminController.showFeedback);
router.post('/feedback/:feedbackId/reply', authenticateAdmin, validate({ params: feedbackIdParamSchema, body: replyFeedbackSchema }), adminController.replyFeedback);
router.patch('/feedback/:feedbackId/status', authenticateAdmin, validate({ params: feedbackIdParamSchema, body: updateFeedbackStatusSchema }), adminController.feedbackStatus);

module.exports = router;
