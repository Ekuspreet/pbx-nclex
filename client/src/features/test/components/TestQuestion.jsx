import { useRef, useState } from 'react'
import QuestionRenderer from '../../../ui/questionnaire/QuestionRenderer.jsx'
import { getCorrectAnswer, hasAnswer } from '../../../ui/questionnaire/questionHelpers.js'
import { createHighlightSelector } from '../testUtils.js'

function QuestionResult({ answerState, question, showAnswerDetails = false }) {
  if (!answerState?.submitted) return null

  const answered = answerState.answered ?? hasAnswer(answerState.value)
  const isCorrect = answered && String(answerState.value) === String(getCorrectAnswer(question))
  const statusColor = isCorrect ? 'text-success' : answered ? 'text-error' : 'text-info'
  const dividerColor = isCorrect ? 'border-success' : answered ? 'border-error' : 'border-info'
  const rows = [
    ...(showAnswerDetails ? [
      ['Your Answer-', answered ? String(answerState.value) : 'Omitted'],
      ['Correct Answer-', String(getCorrectAnswer(question) || '-')],
    ] : []),
    ['Score obtained-', isCorrect ? '1 / 1' : '0 / 1'],
    ['Scoring Rule-', isCorrect ? '1 / 1' : '0 / 1'],
    ['Percentage -', isCorrect ? '100%' : '0%'],
    ['Time Spent-', '0:00'],
  ]

  return (
    <section
      className="relative mt-4 overflow-visible rounded-xl bg-base-100 p-6 shadow-[0_10px_25px_-5px_rgb(0_0_0/0.08),0_8px_10px_-6px_rgb(0_0_0/0.08)]"
      aria-label="Question result"
      aria-live="polite"
    >
      <div className={`score-result-border-run pointer-events-none absolute inset-0 overflow-hidden rounded-xl ${statusColor}`} aria-hidden="true">
        <span className="score-result-border-snake absolute h-[3px] w-28 rounded-full bg-current" />
      </div>
      <h2 className={`mb-4 text-xl font-bold ${statusColor}`}>{isCorrect ? 'Correct' : answered ? 'Incorrect' : 'Omitted'}</h2>
      {rows.map(([label, value], index) => (
        <div className={`flex justify-between py-2.5 text-[15px] ${index < rows.length - 1 ? `border-b ${dividerColor}` : ''}`} key={label}><span>{label}</span><span>{value}</span></div>
      ))}
    </section>
  )
}

function TestQuestion({ answerState, constrained, mode = 'test', onAnswerChange, onHighlight, onNotebook, onSubmit, onUnhighlight, question, showResult = mode === 'test', submitLabel, textSizeClass }) {
  const containerRef = useRef(null)
  const [selection, setSelection] = useState(null)

  const showHighlightAction = () => {
    const activeSelection = window.getSelection()
    const exact = activeSelection?.toString().trim()
    if (!exact || !containerRef.current?.contains(activeSelection.anchorNode)) {
      setSelection(null)
      return
    }

    const selectionRange = activeSelection.getRangeAt(0)
    const highlightRoot = activeSelection.anchorNode?.parentElement?.closest('.reference-html')
    const selector = createHighlightSelector(highlightRoot, selectionRange, 'question')
    if (!selector) {
      setSelection(null)
      return
    }
    const startRange = selectionRange.cloneRange()
    startRange.collapse(true)
    const startBounds = startRange.getClientRects()[0] || selectionRange.getBoundingClientRect()
    const highlightIds = [...containerRef.current.querySelectorAll('[data-highlight-id]')]
      .filter((mark) => selectionRange.intersectsNode(mark))
      .map((mark) => mark.dataset.highlightId)

    setSelection({
      exact: selector.exact,
      highlightIds,
      selector,
      left: startBounds.left,
      top: startBounds.top,
    })
  }

  const saveHighlight = async () => {
    const selector = selection?.selector
    if (!selector) return
    setSelection(null)
    await onHighlight(selector)
    window.getSelection()?.removeAllRanges()
  }

  const saveNotebookNote = async () => {
    const exact = selection?.exact
    if (!exact || typeof onNotebook !== 'function') return
    setSelection(null)
    await onNotebook(exact)
    window.getSelection()?.removeAllRanges()
  }

  const removeHighlight = async () => {
    if (!selection?.highlightIds?.length || typeof onUnhighlight !== 'function') return
    const highlightIds = selection.highlightIds
    setSelection(null)
    await onUnhighlight(highlightIds)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <section
      ref={containerRef}
      className={`${constrained ? 'lg:basis-1/2' : ''} ${textSizeClass} test-adjustable-text min-h-fit flex-none overflow-visible bg-base-100 p-6 pb-[60px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto`}
      aria-label="Question"
      onMouseUp={showHighlightAction}
    >
      <QuestionRenderer
        answerState={answerState}
        question={question}
        showSubmit={mode === 'test'}
        submitLabel={submitLabel}
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
      />
      {showResult ? <QuestionResult answerState={answerState} question={question} showAnswerDetails={mode === 'review'} /> : null}
      {selection ? (
        <div
          className="fixed z-50 grid min-w-44 -translate-y-full rounded-md border border-base-300 bg-base-100 p-1 text-sm text-base-content shadow-xl"
          style={{ left: selection.left, top: selection.top }}
          onMouseDown={(event) => event.preventDefault()}
          onMouseUp={(event) => event.stopPropagation()}
        >
          {selection.highlightIds.length > 0 ? (
            <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={removeHighlight}><span className="material-symbols-outlined !text-[17px]">format_color_reset</span>Unhighlight</button>
          ) : (
            <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={saveHighlight}><span className="material-symbols-outlined !text-[17px]">highlight</span>Highlight</button>
          )}
          {typeof onNotebook === 'function' ? <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={saveNotebookNote}><span className="material-symbols-outlined !text-[17px]">edit_note</span>Write in notebook</button> : null}
        </div>
      ) : null}
    </section>
  )
}

export default TestQuestion
