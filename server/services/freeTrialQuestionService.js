const freeTrialQuestionIds = require('../questions/free-trial-question-ids.json');

const FREE_TRIAL_QUESTION_IDS = Object.freeze([...freeTrialQuestionIds]);
const freeTrialQuestionIdSet = new Set(FREE_TRIAL_QUESTION_IDS);

function getQuestionsForPlan(questionRows, planName = 'free') {
    if (planName === 'plus') return questionRows;

    return questionRows.filter((question) => freeTrialQuestionIdSet.has(question.questionId));
}

module.exports = {
    FREE_TRIAL_QUESTION_IDS,
    getQuestionsForPlan,
};
