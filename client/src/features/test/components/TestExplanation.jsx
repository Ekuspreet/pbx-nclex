import ExplanationPanel from '../../../ui/questionnaire/ExplanationPanel.jsx'

function TestExplanation({ html, textSizeClass }) {
  if (!html) return null

  return (
    <aside className={`ml-3 flex-1 border-l border-base-300 pl-3 ${textSizeClass} test-adjustable-text`} aria-label="Explanation">
      <ExplanationPanel html={html} />
    </aside>
  )
}

export default TestExplanation
