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
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/health', healthController);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.get('/dashboard', authenticate, dashboardController);
router.use('/questions', authenticate, questionRoutes);
router.use('/tests', authenticate, testRoutes);
router.use('/notes', authenticate, noteRoutes);
router.use('/highlights', authenticate, highlightRoutes);
router.use('/feedback', authenticate, feedbackRoutes);

module.exports = router;
