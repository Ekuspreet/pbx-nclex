const { getPublishedContent } = require('../services/contentService');

async function show(req, res, next) {
    try {
        const entry = await getPublishedContent(req.params.key);
        res.status(200).json({ key: entry.key, content: entry.content, version: entry.version, effectiveAt: entry.effectiveAt });
    } catch (error) {
        next(error);
    }
}

module.exports = { show };
