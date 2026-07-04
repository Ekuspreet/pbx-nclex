const {
    addFeedbackReply,
    createFeedbackThread,
    getFeedbackThread,
    listFeedbackForUser,
    updateFeedbackStatus,
} = require('../services/feedbackService');

async function index(req, res, next) {
    try {
        const feedback = await listFeedbackForUser(req.user.id);
        res.status(200).json({ feedback });
    } catch (error) {
        next(error);
    }
}

async function show(req, res, next) {
    try {
        const payload = await getFeedbackThread(req.params.feedbackId, req.user.id);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const payload = await createFeedbackThread(req.user.id, req.body);
        res.status(201).json(payload);
    } catch (error) {
        next(error);
    }
}

async function reply(req, res, next) {
    try {
        const payload = await addFeedbackReply(req.params.feedbackId, 'user', req.body.message, req.user.id);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function close(req, res, next) {
    try {
        const thread = await updateFeedbackStatus(req.params.feedbackId, 'closed');
        res.status(200).json({ thread });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    close,
    create,
    index,
    reply,
    show,
};
