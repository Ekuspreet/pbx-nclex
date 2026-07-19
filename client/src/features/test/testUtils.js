export const MCQ_FORMAT_TYPE_ID = 1
export const MCQ_QUESTION_TYPE_ID = 1

export function formatTestTime(ms) {
  const safeMs = Math.max(0, ms || 0)
  const totalSeconds = Math.floor(safeMs / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function isMcqTestQuestion(item) {
  return Number(item?.question?.formatTypeId) === MCQ_FORMAT_TYPE_ID
    && Number(item?.question?.questionTypeId ?? MCQ_QUESTION_TYPE_ID) === MCQ_QUESTION_TYPE_ID
}

export function getInitialQuestionIndex(questions, currentPosition = 0) {
  if (!questions.length) return 0

  const exactIndex = questions.findIndex((item) => item.position === currentPosition)
  if (exactIndex >= 0) return exactIndex

  const nextIndex = questions.findIndex((item) => item.position > currentPosition)
  return nextIndex >= 0 ? nextIndex : questions.length - 1
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function applyHighlightsToHtml(html, highlights = []) {
  let nextHtml = html || ''

  for (const highlight of highlights) {
    const exact = highlight.selector?.exact
    if (!exact) continue

    const pattern = new RegExp(escapeRegExp(exact), 'i')
    nextHtml = nextHtml.replace(pattern, `<mark data-highlighted="true" class="rounded bg-warning/50 px-0.5">${exact}</mark>`)
  }

  return nextHtml
}
