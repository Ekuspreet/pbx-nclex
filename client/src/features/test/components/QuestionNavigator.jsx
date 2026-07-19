function QuestionNavigator({ current, onClose, onJump, questions }) {
  return (
    <aside className="w-72 overflow-y-auto border-r border-base-content/20 bg-base-100">
      <div className="flex items-center justify-between border-b border-base-300 p-3">
        <h2 className="font-bold">Questions List</h2>
        <button className="btn btn-ghost btn-square btn-sm" type="button" aria-label="Close question navigator" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="grid gap-2 p-3">
        {questions.map((item, index) => {
          const statusClass = index === current
            ? 'btn-primary text-primary-content'
            : item.markedForReview
              ? 'btn-warning'
              : item.answered
                ? 'btn-success'
                : item.visited
                  ? 'btn-outline'
                  : 'btn-ghost'

          return (
            <button className={`btn btn-sm justify-start ${statusClass}`} key={item.id} type="button" onClick={() => onJump(index)}>
              Q: {index + 1}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default QuestionNavigator
