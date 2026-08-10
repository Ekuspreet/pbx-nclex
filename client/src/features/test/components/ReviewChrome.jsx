import { useEffect, useRef, useState } from 'react'

export function ReviewTopBar({ current = 0, question, questionCount = 1 }) {
  return (
    <header className="grid min-h-[68px] shrink-0 grid-cols-2 items-center gap-x-3 gap-y-1 border-b-2 border-test-bar-content bg-test-bar px-3.5 py-2 text-[15px] font-bold leading-[1.2] text-test-bar-content sm:grid-cols-[minmax(260px,1fr)_auto_minmax(260px,1fr)]">
      <div className="flex flex-col gap-1"><p>NCLEX-RN</p><p>PBX Nursing</p></div>
      <div className="order-3 col-span-2 flex min-w-0 flex-col justify-self-center text-center sm:order-none sm:col-span-1">
        <p>Question Review</p>
        <p className="mt-1 text-sm">QID: {question?.questionId || 'N/A'}</p>
      </div>
      <div className="flex flex-col items-end justify-self-end text-right"><p>Question</p><p className="mt-1 text-sm">{current + 1} of {questionCount}</p></div>
    </header>
  )
}

export function ReviewNavbar({ onFullscreen, onSetTextSize, onTheme, textSize }) {
  const [textControlsOpen, setTextControlsOpen] = useState(false)
  const inactivityTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(inactivityTimer.current), [])

  const openTextControls = () => {
    setTextControlsOpen((open) => !open)
    window.clearTimeout(inactivityTimer.current)
    inactivityTimer.current = window.setTimeout(() => setTextControlsOpen(false), 4000)
  }

  const chooseTextSize = (size) => {
    onSetTextSize(size)
    setTextControlsOpen(false)
  }

  return (
    <nav className="flex min-h-10 shrink-0 flex-wrap justify-between bg-test-toolbar px-4 text-[17px] font-bold text-test-bar-content" aria-label="Review tools">
      <div className="flex min-h-10 items-center px-3 text-sm font-semibold">Review mode</div>
      <div className="relative flex items-stretch justify-end">
        <button type="button" aria-label="Toggle fullscreen" className="flex min-h-10 items-center border-l-2 border-test-bar-content px-3.5 hover:text-test-bar-hover" onClick={onFullscreen}><span className="material-symbols-outlined !text-[19px]">fullscreen</span></button>
        <button type="button" aria-expanded={textControlsOpen} aria-label="Adjust question text size" className="flex min-h-10 items-center border-l-2 border-test-bar-content px-3.5 hover:text-test-bar-hover" onClick={openTextControls}><span className="material-symbols-outlined !text-[18px]">format_size</span></button>
        {textControlsOpen ? (
          <div className="absolute right-0 top-[34px] z-40 flex items-center gap-1 rounded-lg border border-base-300 bg-base-100 p-[5px] text-base-content shadow-md" aria-label="Question text size controls">
            {[0, 1, 2, 3].map((size) => <button type="button" aria-label={`Set text size ${size + 1} of 4`} aria-pressed={textSize === size} className={`h-[30px] min-w-[34px] border border-base-300 bg-base-200 font-bold hover:bg-base-300 ${textSize === size ? 'ring-2 ring-primary' : ''}`} key={size} onClick={() => chooseTextSize(size)} style={{ fontSize: `${12 + (size * 2)}px` }}>A</button>)}
          </div>
        ) : null}
        <button type="button" aria-label="Toggle color theme" className="flex min-h-10 items-center border-l-2 border-test-bar-content px-3.5 hover:text-test-bar-hover" onClick={onTheme}><span className="material-symbols-outlined !text-[19px]">dark_mode</span></button>
      </div>
    </nav>
  )
}

export function ReviewBottomControls({ canNext = false, canPrevious = false, onClose, onNext, onPrevious }) {
  return (
    <footer className="flex min-h-10 shrink-0 justify-between bg-test-bar px-[14px] text-[17px] font-bold text-test-bar-content">
      <button type="button" className="flex min-h-10 items-center gap-1 px-3 hover:text-test-bar-hover" onClick={onClose}><span className="material-symbols-outlined !text-[18px]">arrow_back</span> Exit Review</button>
      <div className="flex items-stretch justify-end">
        <button type="button" className="flex min-h-10 items-center gap-1 px-3 hover:text-test-bar-hover disabled:opacity-40" disabled={!canPrevious} onClick={onPrevious}><span className="material-symbols-outlined !text-[18px]">arrow_back</span> Previous</button>
        <button type="button" className="flex min-h-10 items-center gap-1 border-l-2 border-test-bar-content px-3 hover:text-test-bar-hover disabled:opacity-40" disabled={!canNext} onClick={onNext}>Next <span className="material-symbols-outlined !text-[18px]">arrow_forward</span></button>
      </div>
    </footer>
  )
}
