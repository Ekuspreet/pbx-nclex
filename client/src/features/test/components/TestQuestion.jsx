import { useRef, useState } from 'react'
import QuestionRenderer from '../../../ui/questionnaire/QuestionRenderer.jsx'

function TestQuestion({ answerState, constrained, onAnswerChange, onHighlight, onSubmit, question, submitLabel, textSizeClass }) {
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
    if (!selection?.exact) return
    await onHighlight(selection.exact)
    window.getSelection()?.removeAllRanges()
    setSelection(null)
  }

  return (
    <section
      ref={containerRef}
      className={`${constrained ? 'max-w-4/5' : ''} ${textSizeClass} test-adjustable-text min-h-0 flex-1 overflow-y-auto`}
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
      {selection ? (
        <button
          type="button"
          className="fixed z-50 -mt-2 -translate-y-full rounded bg-test-bar-hover px-3 py-1 text-sm font-semibold text-base-content shadow-md"
          style={{ left: selection.left, top: selection.top }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={saveHighlight}
        >
          Highlight
        </button>
      ) : null}
    </section>
  )
}

export default TestQuestion
