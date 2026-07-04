const { desc, eq, ilike, or, sql } = require('drizzle-orm');

const { db, feedbackThreads, questions, users } = require('../db');
const { env } = require('../env');
const { adminCookieOptions, loginAdmin } = require('../services/adminAuthService');
const {
    addFeedbackReply,
    getFeedbackThread,
    listAllFeedback,
    updateFeedbackStatus,
} = require('../services/feedbackService');
const { toClientQuestion } = require('../services/questionBankService');

function login(req, res, next) {
    try {
        const result = loginAdmin(req.body);

        res.cookie(env.ADMIN_COOKIE_NAME, result.token, adminCookieOptions());
        res.status(200).json({
            admin: result.admin,
        });
    } catch (error) {
        next(error);
    }
}

function logout(req, res) {
    res.clearCookie(env.ADMIN_COOKIE_NAME, adminCookieOptions());
    res.status(200).json({ message: 'Logged out.' });
}

function me(req, res) {
    res.status(200).json({ admin: req.admin });
}

async function listUsers(req, res, next) {
    try {
        const conditions = [];

        if (req.query.q) {
            conditions.push(or(
                ilike(users.name, `%${req.query.q}%`),
                ilike(users.email, `%${req.query.q}%`)
            ));
        }

        let query = db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                emailVerified: users.emailVerified,
                status: users.status,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users);

        if (conditions.length > 0) {
            query = query.where(conditions[0]);
        }

        const rows = await query
            .orderBy(desc(users.createdAt))
            .limit(req.query.limit)
            .offset(req.query.offset);

        res.status(200).json({ users: rows });
    } catch (error) {
        next(error);
    }
}

async function listQuestions(req, res, next) {
    try {
        const rows = await db
            .select()
            .from(questions)
            .orderBy(desc(questions.updatedAt))
            .limit(req.query.limit)
            .offset(req.query.offset);

        res.status(200).json({
            questions: rows.map(toClientQuestion),
        });
    } catch (error) {
        next(error);
    }
}

async function listFeedback(req, res, next) {
    try {
        const feedback = await listAllFeedback(req.query);
        res.status(200).json({ feedback });
    } catch (error) {
        next(error);
    }
}

async function showFeedback(req, res, next) {
    try {
        const payload = await getFeedbackThread(req.params.feedbackId);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function replyFeedback(req, res, next) {
    try {
        const payload = await addFeedbackReply(req.params.feedbackId, 'admin', req.body.message);
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

async function feedbackStatus(req, res, next) {
    try {
        const thread = await updateFeedbackStatus(req.params.feedbackId, req.body.status);
        res.status(200).json({ thread });
    } catch (error) {
        next(error);
    }
}

async function dashboard(req, res, next) {
    try {
        const [userCount] = await db.select({ count: sql`count(*)::int` }).from(users);
        const [questionCount] = await db.select({ count: sql`count(*)::int` }).from(questions);
        const openFeedback = await db
            .select()
            .from(feedbackThreads)
            .where(eq(feedbackThreads.status, 'open'));

        res.status(200).json({
            users: userCount?.count || 0,
            questions: questionCount?.count || 0,
            totalUsers: userCount?.count || 0,
            openFeedback: openFeedback.length,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    dashboard,
    feedbackStatus,
    listFeedback,
    listQuestions,
    listUsers,
    login,
    logout,
    me,
    replyFeedback,
    showFeedback,
};
