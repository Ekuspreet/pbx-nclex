import ReferenceHtml from './ReferenceHtml.jsx'

function ExplanationPanel({ html, hidden = false, className = '' }) {
  return (
    <div className={`overflow-scroll ${className}`} hidden={hidden}>
      <p className="my-2 text-md font-semibold">Explanation</p>
      <ReferenceHtml html={html} className="space-y-2" />
    </div>
  )
}

export default ExplanationPanel
