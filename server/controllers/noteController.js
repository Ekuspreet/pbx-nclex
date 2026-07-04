const {
    createNote,
    deleteNote,
    getNote,
    listNotes,
    updateNote,
} = require('../services/noteService');

async function index(req, res, next) {
    try {
        const notes = await listNotes(req.user.id, req.query);
        res.status(200).json({ notes });
    } catch (error) {
        next(error);
    }
}

async function show(req, res, next) {
    try {
        const note = await getNote(req.user.id, req.params.id);
        res.status(200).json({ note });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const note = await createNote(req.user.id, req.body);
        res.status(201).json({ note });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const note = await updateNote(req.user.id, req.params.id, req.body);
        res.status(200).json({ note });
    } catch (error) {
        next(error);
    }
}

async function destroy(req, res, next) {
    try {
        await deleteNote(req.user.id, req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    destroy,
    index,
    show,
    update,
};
