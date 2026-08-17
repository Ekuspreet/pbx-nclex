const { getPublishedContent, listPublishedContent } = require('../services/contentService');

async function show(req, res, next) {
    try {
        const entry = await getPublishedContent(req.params.key);
        res.status(200).json({ key: entry.key, content: entry.content, version: entry.version, effectiveAt: entry.effectiveAt });
    } catch (error) {
        next(error);
    }
}

async function index(req, res, next) {
    try {
        res.status(200).json({ content: await listPublishedContent(req.query.group) });
    } catch (error) {
        next(error);
    }
}

module.exports = { index, show };
