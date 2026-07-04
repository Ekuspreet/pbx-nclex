const {
    createTest,
    getTestPayload,
    getTestResult,
    listUserTests,
    saveAnswer,
    submitTest,
    updateQuestionStatus,
    updateTimer,
} = require('../services/testService');

async function create(req, res, next) {
    try {
        const payload = await createTest(req.user.id, req.body);
        res.status(201).json(payload);
    } catch (error) {
        next(error);
    }
}

async function index(req, res, next) {
    try {
        const tests = await listUserTests(req.user.id);
        res.status(200).json({ tests });
    } catch (error) {
        next(error);
    }
}

async function show(req, res, next) {
    try {
        const payload = await getTestPayload(req.user.id, req.params.testId);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function answer(req, res, next) {
    try {
        const payload = await saveAnswer(req.user.id, req.params.testId, req.body);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function status(req, res, next) {
    try {
        const payload = await updateQuestionStatus(req.user.id, req.params.testId, req.body);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function timer(req, res, next) {
    try {
        const payload = await updateTimer(req.user.id, req.params.testId, req.body);
        res.status(200).json({ test: payload });
    } catch (error) {
        next(error);
    }
}

async function submit(req, res, next) {
    try {
        const payload = await submitTest(req.user.id, req.params.testId);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function result(req, res, next) {
    try {
        const payload = await getTestResult(req.user.id, req.params.testId);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    answer,
    create,
    index,
    result,
    show,
    status,
    submit,
    timer,
};
