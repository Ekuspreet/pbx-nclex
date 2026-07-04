const express = require('express');

const questionController = require('../controllers/questionController');

const router = express.Router();

router.get('/stats', questionController.stats);

module.exports = router;
