import { apiRequest } from './apiClient.js'

export function getDashboard(options = {}) {
  return apiRequest('/dashboard', options)
}

export function getPlans(options = {}) {
  return apiRequest('/plans', { ...options, skipAuthRefresh: true })
}

export function getPaymentHistory(options = {}) {
  return apiRequest('/payments/history', options)
}

export function getQuestionStats(options = {}) {
  return apiRequest('/questions/stats', options)
}

export function createTest(payload) {
  return apiRequest('/tests', {
    method: 'POST',
    body: payload,
  })
}

export function listTests(options = {}) {
  return apiRequest('/tests', options)
}

export function getTest(testId, options = {}) {
  return apiRequest(`/tests/${testId}`, options)
}

export function saveTestAnswer(testId, payload) {
  return apiRequest(`/tests/${testId}/answers`, {
    method: 'PATCH',
    body: payload,
  })
}

export function updateTestStatus(testId, payload) {
  return apiRequest(`/tests/${testId}/status`, {
    method: 'PATCH',
    body: payload,
  })
}

export function updateTestTimer(testId, payload) {
  return apiRequest(`/tests/${testId}/timer`, {
    method: 'PATCH',
    body: payload,
  })
}

export function submitTest(testId) {
  return apiRequest(`/tests/${testId}/submit`, {
    method: 'POST',
  })
}

export function getTestResult(testId, options = {}) {
  return apiRequest(`/tests/${testId}/result`, options)
}

export function listNotes(params = {}, options = {}) {
  const search = new URLSearchParams(params)
  return apiRequest(`/notes${search.size ? `?${search}` : ''}`, options)
}

export function createNote(payload) {
  return apiRequest('/notes', {
    method: 'POST',
    body: payload,
  })
}

export function updateNote(noteId, payload) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteNote(noteId) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'DELETE',
  })
}

export function listHighlights(params = {}, options = {}) {
  const search = new URLSearchParams(params)
  return apiRequest(`/highlights${search.size ? `?${search}` : ''}`, options)
}

export function createHighlight(payload) {
  return apiRequest('/highlights', {
    method: 'POST',
    body: payload,
  })
}

export function deleteHighlight(highlightId) {
  return apiRequest(`/highlights/${highlightId}`, {
    method: 'DELETE',
  })
}

export function listFeedback(options = {}) {
  return apiRequest('/feedback', options)
}

export function createFeedback(payload) {
  return apiRequest('/feedback', {
    method: 'POST',
    body: payload,
  })
}

export function getFeedback(feedbackId, options = {}) {
  return apiRequest(`/feedback/${feedbackId}`, options)
}

export function replyFeedback(feedbackId, message) {
  return apiRequest(`/feedback/${feedbackId}/reply`, {
    method: 'POST',
    body: { message },
  })
}
