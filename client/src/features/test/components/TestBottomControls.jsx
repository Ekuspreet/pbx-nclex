function TestBottomControls({ canNext, canPrevious, isLast, onEnd, onFinish, onNavigator, onNext, onPause, onPrevious }) {
  return (
    <footer className="flex min-h-10 shrink-0 flex-wrap justify-between bg-test-bar px-3.5 text-[17px] font-bold text-test-bar-content">
      <div className="flex w-full flex-wrap items-stretch sm:w-auto">
        <button type="button" className="flex min-h-10 cursor-pointer items-center gap-1 px-3 hover:text-test-bar-hover" onClick={onEnd}>
          <span className="material-symbols-outlined !text-[18px]">logout</span> End
        </button>
        <button type="button" className="flex min-h-10 cursor-pointer items-center gap-1 border-l-2 border-test-bar-content px-3 hover:text-test-bar-hover" onClick={onPause}>
          <span className="material-symbols-outlined !text-[18px]">pause_circle</span> Pause
        </button>
      </div>
      <div className="flex w-full flex-wrap items-stretch justify-end border-t border-test-bar-content/40 sm:w-auto sm:border-t-0">
        <button type="button" className="flex min-h-10 cursor-pointer items-center gap-1 px-3 hover:text-test-bar-hover disabled:opacity-40" disabled={!canPrevious} onClick={onPrevious}>
          <span className="material-symbols-outlined !text-[18px]">arrow_back</span> Previous
        </button>
        <button type="button" className="flex min-h-10 cursor-pointer items-center gap-1 border-l-2 border-test-bar-content px-3 hover:text-test-bar-hover" onClick={onNavigator}>
          <span className="material-symbols-outlined !text-[18px]">search</span> Navigator
        </button>
        {isLast ? (
          <button type="button" className="flex min-h-10 cursor-pointer items-center gap-1 border-l-2 border-test-bar-content px-3 hover:text-test-bar-hover" onClick={onFinish}>
            Finish <span className="material-symbols-outlined">check</span>
          </button>
        ) : (
          <button type="button" className="flex min-h-10 cursor-pointer items-center gap-1 border-l-2 border-test-bar-content px-3 hover:text-test-bar-hover disabled:opacity-40" disabled={!canNext} onClick={onNext}>
            Next <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        )}
      </div>
    </footer>
  )
}

export default TestBottomControls
