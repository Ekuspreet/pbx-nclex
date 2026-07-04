const express = require('express');

const testController = require('../controllers/testController');
const validate = require('../middleware/validate');
const {
    createTestSchema,
    saveAnswerSchema,
    testIdParamSchema,
    updateQuestionStatusSchema,
    updateTimerSchema,
} = require('../validators');

const router = express.Router();

router.get('/', testController.index);
router.post('/', validate({ body: createTestSchema }), testController.create);
router.get('/:testId', validate({ params: testIdParamSchema }), testController.show);
router.patch('/:testId/answers', validate({ params: testIdParamSchema, body: saveAnswerSchema }), testController.answer);
router.patch('/:testId/status', validate({ params: testIdParamSchema, body: updateQuestionStatusSchema }), testController.status);
router.patch('/:testId/timer', validate({ params: testIdParamSchema, body: updateTimerSchema }), testController.timer);
router.post('/:testId/submit', validate({ params: testIdParamSchema }), testController.submit);
router.get('/:testId/result', validate({ params: testIdParamSchema }), testController.result);
router.get('/:testId/review', validate({ params: testIdParamSchema }), testController.result);

module.exports = router;
