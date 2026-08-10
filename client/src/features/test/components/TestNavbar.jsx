import { useEffect, useRef, useState } from 'react'

function TestNavbar({ marked, onCalculator, onFeedback, onFullscreen, onMark, onNotes, onSetTextSize, onTheme, textSize }) {
  const [textControlsOpen, setTextControlsOpen] = useState(false)
  const inactivityTimer = useRef(null)

  const closeTextControlsLater = () => {
    window.clearTimeout(inactivityTimer.current)
    inactivityTimer.current = window.setTimeout(() => setTextControlsOpen(false), 4000)
  }

  useEffect(() => {
    if (textControlsOpen) closeTextControlsLater()
    else window.clearTimeout(inactivityTimer.current)

    return () => window.clearTimeout(inactivityTimer.current)
  }, [textControlsOpen])

  const toggleTextControls = () => setTextControlsOpen((open) => !open)

  const selectTextSize = (size) => {
    onSetTextSize(size)
    setTextControlsOpen(false)
  }

  return (
    <nav className="flex min-h-10 shrink-0 flex-wrap justify-between bg-test-toolbar px-4 text-[17px] font-bold text-test-bar-content" aria-label="Test tools">
      <div className="flex w-full flex-wrap items-stretch sm:w-auto">
        <button type="button" className="flex min-h-10 items-center gap-1 border-r-2 border-test-bar-content px-3 hover:text-test-bar-hover" onClick={onNotes}>
          <span className="material-symbols-outlined !text-[18px]">note_alt</span> Notes
        </button>
        <button type="button" className="flex min-h-10 items-center gap-1 border-r-2 border-test-bar-content px-3 hover:text-test-bar-hover" onClick={onCalculator}>
          <span className="material-symbols-outlined !text-[18px]">calculate</span> Calc.
        </button>
        <button type="button" className="flex min-h-10 items-center gap-1 px-3 hover:text-test-bar-hover" onClick={onFeedback}>
          <span className="material-symbols-outlined !text-[18px]">forum</span> Feedback
        </button>
      </div>
      <div className="relative flex w-full flex-wrap items-stretch justify-end border-t border-test-bar-content/40 sm:w-auto sm:border-t-0">
        <button type="button" aria-label="Toggle fullscreen" className="flex min-h-10 items-center border-l-2 border-test-bar-content px-3.5 hover:text-test-bar-hover" onClick={onFullscreen}>
          <span className="material-symbols-outlined !text-[19px]">fullscreen</span>
        </button>
        <button
          type="button"
          aria-expanded={textControlsOpen}
          aria-label="Adjust question text size"
          className="flex min-h-10 items-center border-l-2 border-test-bar-content px-3.5 hover:text-test-bar-hover"
          onClick={toggleTextControls}
        >
          <span className="material-symbols-outlined !text-[18px]">format_size</span>
        </button>
        {textControlsOpen ? (
          <div className="absolute right-0 top-[34px] z-40 flex items-center gap-1 rounded-lg border border-base-300 bg-base-100 p-[5px] text-base-content shadow-md" aria-label="Question text size controls" onMouseMove={closeTextControlsLater}>
            {[0, 1, 2, 3].map((size) => (
              <button
                type="button"
                aria-label={`Set text size ${size + 1} of 4`}
                aria-pressed={textSize === size}
                className={`h-[30px] min-w-[34px] border border-base-300 bg-base-200 font-bold hover:bg-base-300 ${textSize === size ? 'ring-2 ring-primary' : ''}`}
                key={size}
                onClick={() => selectTextSize(size)}
                style={{ fontSize: `${12 + (size * 2)}px` }}
              >A</button>
            ))}
          </div>
        ) : null}
        <button type="button" aria-label="Toggle color theme" className="flex min-h-10 items-center border-l-2 border-test-bar-content px-3.5 hover:text-test-bar-hover" onClick={onTheme}>
          <span className="material-symbols-outlined !text-[19px]">dark_mode</span>
        </button>
        <button type="button" aria-pressed={marked} className={`flex min-h-10 items-center gap-1 border-l-2 border-test-bar-content px-3 hover:text-test-bar-hover ${marked ? 'text-test-bar-hover' : ''}`} onClick={onMark}>
          <span className="material-symbols-outlined !text-[18px]">flag</span> Mark for Review
        </button>
      </div>
    </nav>
  )
}

export default TestNavbar
