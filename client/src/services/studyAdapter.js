import { apiRequest } from './apiClient.js'

export function getDashboard() {
  return apiRequest('/dashboard')
}

export function getQuestionStats() {
  return apiRequest('/questions/stats')
}

export function createTest(payload) {
  return apiRequest('/tests', {
    method: 'POST',
    body: payload,
  })
}

export function listTests() {
  return apiRequest('/tests')
}

export function getTest(testId) {
  return apiRequest(`/tests/${testId}`)
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

export function getTestResult(testId) {
  return apiRequest(`/tests/${testId}/result`)
}

export function listNotes(params = {}) {
  const search = new URLSearchParams(params)
  return apiRequest(`/notes${search.size ? `?${search}` : ''}`)
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

export function listHighlights(params = {}) {
  const search = new URLSearchParams(params)
  return apiRequest(`/highlights${search.size ? `?${search}` : ''}`)
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

export function listFeedback() {
  return apiRequest('/feedback')
}

export function createFeedback(payload) {
  return apiRequest('/feedback', {
    method: 'POST',
    body: payload,
  })
}

export function getFeedback(feedbackId) {
  return apiRequest(`/feedback/${feedbackId}`)
}

export function replyFeedback(feedbackId, message) {
  return apiRequest(`/feedback/${feedbackId}/reply`, {
    method: 'POST',
    body: { message },
  })
}
