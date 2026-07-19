import { useState } from 'react'

function TestNavbar({ marked, onCalculator, onDecreaseText, onFeedback, onFullscreen, onIncreaseText, onMark, onNotes, onTheme, textSize }) {
  const [textControlsOpen, setTextControlsOpen] = useState(false)

  return (
    <nav className="flex justify-between border-t-2 border-test-bar-content bg-test-toolbar text-lg text-test-bar-content" aria-label="Test tools">
      <div className="flex items-stretch font-semibold">
        <button type="button" className="flex place-items-center gap-1 p-2 hover:bg-test-bar-hover" onClick={onNotes}>
          <span className="material-symbols-outlined">add_notes</span> Notes
        </button>
        <button type="button" className="flex place-items-center gap-1 p-2 hover:bg-test-bar-hover" onClick={onCalculator}>
          <span className="material-symbols-outlined">calculate</span> Calculator
        </button>
        <button type="button" className="flex place-items-center gap-1 p-2 hover:bg-test-bar-hover" onClick={onFeedback}>
          <span className="material-symbols-outlined">feedback</span> Feedback
        </button>
      </div>
      <div className="relative flex items-stretch font-semibold">
        <button
          type="button"
          aria-expanded={textControlsOpen}
          aria-label="Adjust question text size"
          className="flex place-items-center p-2 hover:bg-test-bar-hover"
          onClick={() => setTextControlsOpen((open) => !open)}
        >
          <span className="material-symbols-outlined">text_fields</span>
        </button>
        {textControlsOpen ? (
          <div className="absolute right-0 top-full z-40 flex items-center gap-2 rounded-b bg-test-toolbar p-2 text-test-bar-content shadow-md" aria-label="Question text size controls">
            <button
              type="button"
              aria-label="Decrease question text size"
              className="flex place-items-center rounded p-1 hover:bg-test-bar-hover disabled:opacity-40"
              disabled={textSize === 0}
              onClick={onDecreaseText}
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <div className="flex items-end gap-1" aria-label={`Text size ${textSize + 1} of 4`}>
              {[0, 1, 2, 3].map((size) => (
                <span className={`w-1 rounded bg-test-bar-content ${size <= textSize ? 'h-4' : 'h-2 opacity-50'}`} key={size} />
              ))}
            </div>
            <button
              type="button"
              aria-label="Increase question text size"
              className="flex place-items-center rounded p-1 hover:bg-test-bar-hover disabled:opacity-40"
              disabled={textSize === 3}
              onClick={onIncreaseText}
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        ) : null}
        <button type="button" aria-label="Toggle fullscreen" className="flex place-items-center p-2 hover:bg-test-bar-hover" onClick={onFullscreen}>
          <span className="material-symbols-outlined">fullscreen</span>
        </button>
        <button type="button" aria-label="Toggle color theme" className="flex place-items-center p-2 hover:bg-test-bar-hover" onClick={onTheme}>
          <span className="material-symbols-outlined">contrast</span>
        </button>
        <button type="button" aria-pressed={marked} className={`p-2 hover:bg-test-bar-hover ${marked ? 'bg-warning/30' : ''}`} onClick={onMark}>
          Mark for Review
        </button>
      </div>
    </nav>
  )
}

export default TestNavbar
