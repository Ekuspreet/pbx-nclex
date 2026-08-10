import { useRef, useState } from 'react'
import ExplanationPanel from '../../../ui/questionnaire/ExplanationPanel.jsx'
import { createHighlightSelector } from '../testUtils.js'

function TestExplanation({ html, onHighlight, onNotebook, onUnhighlight, textSizeClass }) {
  const containerRef = useRef(null)
  const [selection, setSelection] = useState(null)

  if (!html) return null

  const captureSelection = () => {
    const activeSelection = window.getSelection()
    const exact = activeSelection?.toString().trim()
    if (!exact || !containerRef.current?.contains(activeSelection.anchorNode)) {
      setSelection(null)
      return
    }
    const selectionRange = activeSelection.getRangeAt(0)
    const highlightRoot = activeSelection.anchorNode?.parentElement?.closest('.reference-html')
    const selector = createHighlightSelector(highlightRoot, selectionRange, 'explanation')
    if (!selector) {
      setSelection(null)
      return
    }
    const bounds = selectionRange.getBoundingClientRect()
    const highlightIds = [...containerRef.current.querySelectorAll('[data-highlight-id]')]
      .filter((mark) => selectionRange.intersectsNode(mark))
      .map((mark) => mark.dataset.highlightId)
    setSelection({ exact: selector.exact, highlightIds, selector, left: bounds.left + (bounds.width / 2) - 88, top: bounds.top })
  }

  const runAction = async (action) => {
    const value = action === onHighlight ? selection?.selector : action === onUnhighlight ? selection?.highlightIds : selection?.exact
    if (!value || typeof action !== 'function') return
    setSelection(null)
    await action(value)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <aside ref={containerRef} className={`min-h-fit flex-none border-t border-base-content/50 bg-base-100 p-6 pb-[60px] lg:min-h-0 lg:basis-1/2 lg:overflow-y-auto lg:border-l lg:border-t-0 ${textSizeClass} test-adjustable-text`} aria-label="Explanation" onMouseUp={captureSelection}>
      <ExplanationPanel html={html} />
      {selection ? (
        <div className="fixed z-50 grid min-w-44 -translate-y-full rounded-md border border-base-300 bg-base-100 p-1 text-sm text-base-content shadow-xl" style={{ left: selection.left, top: selection.top }} onMouseDown={(event) => event.preventDefault()} onMouseUp={(event) => event.stopPropagation()}>
          {selection.highlightIds.length > 0 ? (
            <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={() => runAction(onUnhighlight)}><span className="material-symbols-outlined !text-[17px]">format_color_reset</span>Unhighlight</button>
          ) : (
            <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={() => runAction(onHighlight)}><span className="material-symbols-outlined !text-[17px]">highlight</span>Highlight</button>
          )}
          {typeof onNotebook === 'function' ? <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-base-200" type="button" onClick={() => runAction(onNotebook)}><span className="material-symbols-outlined !text-[17px]">edit_note</span>Write in notebook</button> : null}
        </div>
      ) : null}
    </aside>
  )
}

export default TestExplanation
