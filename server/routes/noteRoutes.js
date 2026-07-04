const express = require('express');

const noteController = require('../controllers/noteController');
const validate = require('../middleware/validate');
const {
    createNoteSchema,
    listContextQuerySchema,
    updateNoteSchema,
    uuidParamSchema,
} = require('../validators');

const router = express.Router();

router.get('/', validate({ query: listContextQuerySchema }), noteController.index);
router.post('/', validate({ body: createNoteSchema }), noteController.create);
router.get('/:id', validate({ params: uuidParamSchema }), noteController.show);
router.patch('/:id', validate({ params: uuidParamSchema, body: updateNoteSchema }), noteController.update);
router.delete('/:id', validate({ params: uuidParamSchema }), noteController.destroy);

module.exports = router;
