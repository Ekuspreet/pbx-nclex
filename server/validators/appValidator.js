const { z } = require('zod');

const uuidParamSchema = z.object({
    id: z.string().uuid(),
});

const testIdParamSchema = z.object({
    testId: z.string().uuid(),
});

const feedbackIdParamSchema = z.object({
    feedbackId: z.string().uuid(),
});

const questionIdParamSchema = z.object({
    questionId: z.string().uuid(),
});

const createTestSchema = z.object({
    tutorMode: z.boolean().default(false),
    timed: z.boolean().default(false),
    subjects: z.array(z.string().trim().min(1)).default([]),
    systems: z.array(z.string().trim().min(1)).default([]),
    questionCount: z.number().int().min(1).max(80),
    showRationales: z.boolean().default(true),
});

const answerSchema = z.union([
    z.string(),
    z.number(),
]);

const saveAnswerSchema = z.object({
    questionId: z.string().uuid(),
    answer: answerSchema,
    position: z.number().int().min(0).optional(),
});

const updateQuestionStatusSchema = z.object({
    questionId: z.string().uuid().optional(),
    currentPosition: z.number().int().min(0).optional(),
    visited: z.boolean().optional(),
    markedForReview: z.boolean().optional(),
});

const updateTimerSchema = z.object({
    elapsedMs: z.number().int().min(0).optional(),
    remainingMs: z.number().int().min(0).nullable().optional(),
});

const listContextQuerySchema = z.object({
    testId: z.string().uuid().optional(),
    questionId: z.string().uuid().optional(),
});

const createNoteSchema = z.object({
    testId: z.string().uuid().optional(),
    questionId: z.string().uuid(),
    title: z.string().trim().min(1).max(160),
    content: z.string().trim().min(1).max(20000),
});

const updateNoteSchema = z.object({
    title: z.string().trim().min(1).max(160).optional(),
    content: z.string().trim().min(1).max(20000).optional(),
}).refine((value) => value.title !== undefined || value.content !== undefined, {
    message: 'At least one field is required.',
});

const highlightSelectorSchema = z.object({
    region: z.string().trim().max(120).optional(),
    exact: z.string().trim().min(1).max(5000),
    prefix: z.string().trim().max(500).optional(),
    suffix: z.string().trim().max(500).optional(),
    start: z.number().int().min(0).optional(),
    end: z.number().int().min(0).optional(),
});

const createHighlightSchema = z.object({
    testId: z.string().uuid().optional(),
    questionId: z.string().uuid(),
    selector: highlightSelectorSchema,
    color: z.string().trim().min(1).max(40).default('yellow'),
});

const updateHighlightSchema = z.object({
    selector: highlightSelectorSchema.optional(),
    color: z.string().trim().min(1).max(40).optional(),
}).refine((value) => value.selector !== undefined || value.color !== undefined, {
    message: 'At least one field is required.',
});

const replaceHighlightsSchema = z.object({
    testId: z.string().uuid().optional(),
    questionId: z.string().uuid(),
    highlights: z.array(z.object({
        selector: highlightSelectorSchema,
        color: z.string().trim().min(1).max(40).default('yellow'),
    })).max(100),
});

const createFeedbackSchema = z.object({
    questionId: z.string().uuid().optional(),
    testId: z.string().uuid().optional(),
    subject: z.string().trim().min(1).max(180),
    message: z.string().trim().min(1).max(20000),
});

const replyFeedbackSchema = z.object({
    message: z.string().trim().min(1).max(20000),
});

const updateFeedbackStatusSchema = z.object({
    status: z.enum(['open', 'reviewing', 'resolved', 'closed']),
});

const adminLoginSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
});

const paginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    status: z.string().trim().optional(),
    q: z.string().trim().optional(),
});

module.exports = {
    adminLoginSchema,
    createFeedbackSchema,
    createHighlightSchema,
    createNoteSchema,
    createTestSchema,
    feedbackIdParamSchema,
    listContextQuerySchema,
    paginationQuerySchema,
    questionIdParamSchema,
    replaceHighlightsSchema,
    replyFeedbackSchema,
    saveAnswerSchema,
    testIdParamSchema,
    updateFeedbackStatusSchema,
    updateHighlightSchema,
    updateNoteSchema,
    updateQuestionStatusSchema,
    updateTimerSchema,
    uuidParamSchema,
};
