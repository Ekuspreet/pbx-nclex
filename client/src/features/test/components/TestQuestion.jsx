import { useRef, useState } from 'react'
import QuestionRenderer from '../../../ui/questionnaire/QuestionRenderer.jsx'
import { getCorrectAnswer } from '../../../ui/questionnaire/questionHelpers.js'

function QuestionResult({ answerState, question }) {
  if (!answerState?.submitted) return null

  const isCorrect = String(answerState.value) === String(getCorrectAnswer(question))
  const rows = [
    ['Score obtained-', isCorrect ? '1 / 1' : '0 / 1'],
    ['Scoring Rule-', isCorrect ? '1 / 1' : '0 / 1'],
    ['Percentage -', isCorrect ? '100%' : '0%'],
    ['Time Spent-', '0:00'],
  ]

  return (
    <section className="mt-4 rounded-[10px] border-2 border-base-300 bg-base-100 px-5 py-4 shadow-lg" aria-label="Question result">
      <h2 className={`mb-3 text-lg font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</h2>
      {rows.map(([label, value], index) => (
        <div className={`flex justify-between py-1.5 text-sm ${index < rows.length - 1 ? `border-b ${isCorrect ? 'border-success' : 'border-error'}` : ''}`} key={label}><span>{label}</span><span>{value}</span></div>
      ))}
    </section>
  )
}

function TestQuestion({ answerState, constrained, onAnswerChange, onHighlight, onNotebook, onSubmit, question, submitLabel, textSizeClass }) {
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
    const startRange = selectionRange.cloneRange()
    startRange.collapse(true)
    const startBounds = startRange.getClientRects()[0] || selectionRange.getBoundingClientRect()

    setSelection({
      exact,
      left: startBounds.left,
      top: startBounds.top,
    })
  }

  const saveHighlight = async () => {
    const exact = selection?.exact
    if (!exact) return
    setSelection(null)
    await onHighlight(exact)
    window.getSelection()?.removeAllRanges()
  }

  const saveNotebookNote = async () => {
    const exact = selection?.exact
    if (!exact || typeof onNotebook !== 'function') return
    setSelection(null)
    await onNotebook(exact)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <section
      ref={containerRef}
      className={`${constrained ? 'lg:basis-1/2' : ''} ${textSizeClass} test-adjustable-text min-h-fit flex-none overflow-visible bg-base-100 p-4 pb-10 sm:p-6 sm:pb-16 lg:min-h-0 lg:flex-1 lg:overflow-y-auto`}
      aria-label="Question"
      onMouseUp={showHighlightAction}
    >
      <QuestionRenderer
        answerState={answerState}
        question={question}
        submitLabel={submitLabel}
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
      />
      <QuestionResult answerState={answerState} question={question} />
      {selection ? (
        <div
          className="fixed z-50 grid min-w-44 -translate-y-full rounded-md border border-base-300 bg-base-100 p-1 text-sm text-base-content shadow-xl"
          style={{ left: selection.left, top: selection.top }}
          onMouseDown={(event) => event.preventDefault()}
          onMouseUp={(event) => event.stopPropagation()}
        >
          <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={saveHighlight}><span className="material-symbols-outlined !text-[17px]">highlight</span>Highlight</button>
          <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={saveNotebookNote}><span className="material-symbols-outlined !text-[17px]">edit_note</span>Write in notebook</button>
        </div>
      ) : null}
    </section>
  )
}

export default TestQuestion
