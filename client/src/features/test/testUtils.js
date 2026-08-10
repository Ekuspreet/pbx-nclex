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

function getBoundaryOffset(root, boundaryNode, boundaryOffset) {
  const document = root.ownerDocument
  const walker = document.createTreeWalker(root, 4)
  let offset = 0
  let node = walker.nextNode()

  while (node) {
    if (node === boundaryNode) return offset + Math.min(boundaryOffset, node.data.length)
    offset += node.data.length
    node = walker.nextNode()
  }

  const range = document.createRange()
  range.selectNodeContents(root)
  range.setEnd(boundaryNode, boundaryOffset)
  return range.toString().length
}

export function createHighlightSelector(root, range, region = 'question') {
  if (!root || !range || !root.contains(range.commonAncestorContainer)) return null

  const fullText = root.textContent || ''
  let start = getBoundaryOffset(root, range.startContainer, range.startOffset)
  let end = getBoundaryOffset(root, range.endContainer, range.endOffset)
  const selectedText = fullText.slice(start, end)
  const leadingWhitespace = selectedText.length - selectedText.trimStart().length
  const trailingWhitespace = selectedText.length - selectedText.trimEnd().length
  start += leadingWhitespace
  end -= trailingWhitespace
  const exact = fullText.slice(start, end)
  if (!exact) return null

  return {
    region,
    exact,
    start,
    end,
    prefix: fullText.slice(Math.max(0, start - 80), start),
    suffix: fullText.slice(end, end + 80),
  }
}

function resolveHighlightRange(text, selector) {
  const { exact, prefix = '', suffix = '' } = selector
  const start = Number(selector.start)
  const end = Number(selector.end)

  if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && text.slice(start, end) === exact) {
    return { start, end }
  }

  let match = text.indexOf(exact)
  let fallback = match
  while (match >= 0) {
    const prefixMatches = !prefix || text.slice(Math.max(0, match - prefix.length), match) === prefix
    const matchEnd = match + exact.length
    const suffixMatches = !suffix || text.slice(matchEnd, matchEnd + suffix.length) === suffix
    if (prefixMatches && suffixMatches) return { start: match, end: matchEnd }
    match = text.indexOf(exact, match + 1)
  }

  return fallback >= 0 ? { start: fallback, end: fallback + exact.length } : null
}

function applyHighlightToHtml(html, selector, highlightId) {
  if (typeof DOMParser === 'undefined') return html

  const document = new DOMParser().parseFromString(String(html || ''), 'text/html')
  const text = document.body.textContent || ''
  const resolved = resolveHighlightRange(text, selector)
  if (!resolved) return html

  const walker = document.createTreeWalker(document.body, 4)
  const nodes = []
  let textOffset = 0
  let node = walker.nextNode()
  while (node) {
    const nodeStart = textOffset
    const nodeEnd = nodeStart + node.data.length
    if (nodeEnd > resolved.start && nodeStart < resolved.end && !node.parentElement?.closest('[data-highlighted="true"]')) {
      nodes.push({ node, nodeStart, nodeEnd })
    }
    textOffset = nodeEnd
    node = walker.nextNode()
  }

  for (const entry of nodes) {
    const from = Math.max(0, resolved.start - entry.nodeStart)
    const to = Math.min(entry.node.data.length, resolved.end - entry.nodeStart)
    const selectedNode = from > 0 ? entry.node.splitText(from) : entry.node
    selectedNode.splitText(to - from)
    const mark = document.createElement('mark')
    mark.className = 'user-highlight'
    mark.dataset.highlighted = 'true'
    if (highlightId) mark.dataset.highlightId = highlightId
    selectedNode.replaceWith(mark)
    mark.append(selectedNode)
  }

  return document.body.innerHTML
}

export function applyHighlightsToHtml(html, highlights = [], region = 'question') {
  let nextHtml = html || ''

  for (const highlight of highlights) {
    if ((highlight.selector?.region || 'question') !== region) continue
    const exact = highlight.selector?.exact
    if (!exact) continue

    nextHtml = applyHighlightToHtml(nextHtml, highlight.selector, highlight.id)
  }

  return nextHtml
}
