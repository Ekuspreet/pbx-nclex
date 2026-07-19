function TestBottomControls({ canNext, canPrevious, isLast, onEnd, onFinish, onNavigator, onNext, onPause, onPrevious }) {
  return (
    <footer className="flex justify-between bg-test-bar text-lg text-test-bar-content">
      <div className="flex items-stretch font-semibold">
        <button type="button" className="flex cursor-pointer place-items-center gap-1 p-2 hover:bg-test-bar-hover" onClick={onEnd}>
          <span className="material-symbols-outlined">stop</span> End
        </button>
        <button type="button" className="flex cursor-pointer place-items-center gap-1 p-2 hover:bg-test-bar-hover" onClick={onPause}>
          <span className="material-symbols-outlined">pause</span> Pause
        </button>
      </div>
      <div className="flex items-stretch font-semibold">
        <button type="button" className="flex cursor-pointer place-items-center gap-1 p-2 hover:bg-test-bar-hover" disabled={!canPrevious} onClick={onPrevious}>
          <span className="material-symbols-outlined">arrow_back</span> Previous
        </button>
        <button type="button" className="flex cursor-pointer place-items-center gap-1 p-2 hover:bg-test-bar-hover" onClick={onNavigator}>
          <span className="material-symbols-outlined">search</span> Navigator
        </button>
        {isLast ? (
          <button type="button" className="flex cursor-pointer place-items-center gap-1 p-2 hover:bg-test-bar-hover" onClick={onFinish}>
            Finish <span className="material-symbols-outlined">check</span>
          </button>
        ) : (
          <button type="button" className="flex cursor-pointer place-items-center gap-1 p-2 hover:bg-test-bar-hover" disabled={!canNext} onClick={onNext}>
            Next <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        )}
      </div>
    </footer>
  )
}

export default TestBottomControls
