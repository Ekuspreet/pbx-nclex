function normalizedParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))
}

export const queryKeys = {
  maintenance: ['maintenance'],
  exhibit: (url) => ['exhibits', url],
  session: ['session'],
  plans: ['plans'],
  dashboard: ['dashboard'],
  performance: ['dashboard', 'performance'],
  questionStats: ['questions', 'stats'],
  tests: ['tests'],
  test: (testId) => ['tests', testId],
  testResult: (testId) => ['tests', testId, 'result'],
  notes: (params) => ['notes', normalizedParams(params)],
  highlights: (params) => ['highlights', normalizedParams(params)],
  feedback: ['feedback'],
  feedbackDetail: (feedbackId) => ['feedback', feedbackId],
  payments: ['payments'],
  referralSummary: ['referral', 'summary'],
  walletLedger: ['wallet', 'ledger'],
  adminSession: ['admin', 'session'],
  adminDashboard: ['admin', 'dashboard'],
  adminResource: (endpoint, params) => ['admin', endpoint, normalizedParams(params)],
  adminFeedbackDetail: (feedbackId) => ['admin', 'feedback', feedbackId],
}
