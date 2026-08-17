const express = require('express');

const healthController = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const dashboardController = require('../controllers/dashboardController');
const feedbackRoutes = require('./feedbackRoutes');
const highlightRoutes = require('./highlightRoutes');
const noteRoutes = require('./noteRoutes');
const questionRoutes = require('./questionRoutes');
const testRoutes = require('./testRoutes');
const paymentRoutes = require('./paymentRoutes');
const referralRoutes = require('./referralRoutes');
const walletRoutes = require('./walletRoutes');
const authenticate = require('../middleware/authenticate');
const planController = require('../controllers/planController');
const contentRoutes = require('./contentRoutes');

const router = express.Router();

router.get('/health', healthController);
router.get('/plans', planController.index);
router.use('/content', contentRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.get('/dashboard', authenticate, dashboardController);
router.use('/questions', authenticate, questionRoutes);
router.use('/tests', authenticate, testRoutes);
router.use('/notes', authenticate, noteRoutes);
router.use('/highlights', authenticate, highlightRoutes);
router.use('/feedback', authenticate, feedbackRoutes);
router.use('/payments', authenticate, paymentRoutes);
router.use('/referrals', authenticate, referralRoutes);
router.use('/wallet', authenticate, walletRoutes);

module.exports = router;
