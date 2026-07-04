export function stripExhibitLink(html = '') {
  return String(html || '').replace(/<p>.*?id="exhibit".*?<\/p>/gi, '')
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
