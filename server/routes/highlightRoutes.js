const express = require('express');

const highlightController = require('../controllers/highlightController');
const validate = require('../middleware/validate');
const {
    createHighlightSchema,
    listContextQuerySchema,
    replaceHighlightsSchema,
    updateHighlightSchema,
    uuidParamSchema,
} = require('../validators');

const router = express.Router();

router.get('/', validate({ query: listContextQuerySchema }), highlightController.index);
router.put('/question', validate({ body: replaceHighlightsSchema }), highlightController.replace);
router.post('/', validate({ body: createHighlightSchema }), highlightController.create);
router.patch('/:id', validate({ params: uuidParamSchema, body: updateHighlightSchema }), highlightController.update);
router.delete('/:id', validate({ params: uuidParamSchema }), highlightController.destroy);

module.exports = router;
