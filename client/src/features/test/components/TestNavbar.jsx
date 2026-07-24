import { useState } from 'react'

function TestNavbar({ marked, onCalculator, onDecreaseText, onFeedback, onFullscreen, onIncreaseText, onMark, onNotes, onTheme, textSize }) {
  const [textControlsOpen, setTextControlsOpen] = useState(false)

  return (
    <nav className="flex min-h-10 shrink-0 flex-wrap justify-between bg-test-toolbar text-[17px] font-bold text-test-bar-content" aria-label="Test tools">
      <div className="flex w-full flex-wrap items-stretch sm:w-auto">
        <button type="button" className="flex min-h-10 items-center gap-1 border-r-2 border-test-bar-content px-4 hover:text-test-bar-hover" onClick={onNotes}>
          <span className="material-symbols-outlined !text-[18px]">note_alt</span> Notes
        </button>
        <button type="button" className="flex min-h-10 items-center gap-1 border-r-2 border-test-bar-content px-4 hover:text-test-bar-hover" onClick={onCalculator}>
          <span className="material-symbols-outlined !text-[18px]">calculate</span> Calc.
        </button>
        <button type="button" className="flex min-h-10 items-center gap-1 px-4 hover:text-test-bar-hover" onClick={onFeedback}>
          <span className="material-symbols-outlined !text-[18px]">forum</span> Feedback
        </button>
      </div>
      <div className="relative flex w-full flex-wrap items-stretch justify-end border-t border-test-bar-content/40 sm:w-auto sm:border-t-0">
        <button type="button" aria-label="Toggle fullscreen" className="flex min-h-10 items-center border-l-2 border-test-bar-content px-4 hover:text-test-bar-hover" onClick={onFullscreen}>
          <span className="material-symbols-outlined !text-[19px]">fullscreen</span>
        </button>
        <button
          type="button"
          aria-expanded={textControlsOpen}
          aria-label="Adjust question text size"
          className="flex min-h-10 items-center border-l-2 border-test-bar-content px-4 hover:text-test-bar-hover"
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
        <button type="button" aria-label="Toggle color theme" className="flex min-h-10 items-center border-l-2 border-test-bar-content px-4 hover:text-test-bar-hover" onClick={onTheme}>
          <span className="material-symbols-outlined !text-[19px]">dark_mode</span>
        </button>
        <button type="button" aria-pressed={marked} className={`flex min-h-10 items-center gap-1 border-l-2 border-test-bar-content px-4 hover:text-test-bar-hover ${marked ? 'text-test-bar-hover' : ''}`} onClick={onMark}>
          <span className="material-symbols-outlined !text-[18px]">flag</span> Mark for Review
        </button>
      </div>
    </nav>
  )
}

export default TestNavbar
