const {
    createHighlight,
    deleteHighlight,
    listHighlights,
    replaceQuestionHighlights,
    updateHighlight,
} = require('../services/highlightService');

async function index(req, res, next) {
    try {
        const highlights = await listHighlights(req.user.id, req.query);
        res.status(200).json({ highlights });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const highlight = await createHighlight(req.user.id, req.body);
        res.status(201).json({ highlight });
    } catch (error) {
        next(error);
    }
}

async function replace(req, res, next) {
    try {
        const highlights = await replaceQuestionHighlights(req.user.id, req.body);
        res.status(200).json({ highlights });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const highlight = await updateHighlight(req.user.id, req.params.id, req.body);
        res.status(200).json({ highlight });
    } catch (error) {
        next(error);
    }
}

async function destroy(req, res, next) {
    try {
        await deleteHighlight(req.user.id, req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    destroy,
    index,
    replace,
    update,
};
