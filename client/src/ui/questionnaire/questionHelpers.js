export function stripExhibitLink(html = '') {
  return String(html || '').replace(/<p>\s*(?:<a\b[^>]*>\s*Exhibit(?:\s*\d+)?\s*<\/a>\s*(?:\|\s*)?)+\s*<\/p>/gi, '')
}

export function getCorrectAnswer(question) {
  return String(question?.correctAnswer ?? '')
}

export function hasAnswer(value) {
  return String(value ?? '').trim().length > 0
}

export function getInitialAnswerValue() {
  return ''
}
