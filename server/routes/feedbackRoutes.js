const express = require('express');

const feedbackController = require('../controllers/feedbackController');
const validate = require('../middleware/validate');
const {
    createFeedbackSchema,
    feedbackIdParamSchema,
    replyFeedbackSchema,
} = require('../validators');

const router = express.Router();

router.get('/', feedbackController.index);
router.post('/', validate({ body: createFeedbackSchema }), feedbackController.create);
router.get('/:feedbackId', validate({ params: feedbackIdParamSchema }), feedbackController.show);
router.post('/:feedbackId/reply', validate({ params: feedbackIdParamSchema, body: replyFeedbackSchema }), feedbackController.reply);
router.post('/:feedbackId/close', validate({ params: feedbackIdParamSchema }), feedbackController.close);

module.exports = router;
