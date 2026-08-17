const express = require('express');

const contentController = require('../controllers/contentController');

const router = express.Router();

router.get('/', contentController.index);
router.get('/:key', contentController.show);

module.exports = router;
