const STATUS_LEGEND = [
  { className: 'bg-success', label: 'Correct' },
  { className: 'bg-error', label: 'Incorrect' },
  { className: 'bg-info', label: 'Answered' },
  { className: 'bg-neutral/75', label: 'Omitted' },
  { className: 'bg-base-content/45', label: 'Pending' },
]

function getQuestionStatus(item) {
  if (item.answered && item.isCorrect === true) return { className: 'bg-success', label: 'Correct' }
  if (item.answered && item.isCorrect === false) return { className: 'bg-error', label: 'Incorrect' }
  if (item.answered) return { className: 'bg-info', label: 'Answered' }
  if (item.visited) return { className: 'bg-neutral/75', label: 'Omitted' }
  return { className: 'bg-base-content/45', label: 'Pending' }
}

function QuestionNavigator({ current, onClose, onJump, questions }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-base-100 shadow-2xl" role="dialog" aria-modal="true" aria-label="Question navigator">
        <header className="flex items-center justify-between bg-test-bar px-4 py-3 font-bold text-test-bar-content"><span>Questions List</span><button type="button" onClick={onClose}><span className="material-symbols-outlined">close</span></button></header>
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-base-300 px-4 py-2 text-xs">
          {STATUS_LEGEND.map((status) => <span key={status.label}><i className={`mr-1 inline-block size-2.5 rounded-full ${status.className}`} />{status.label}</span>)}
        </div>
        <div className="overflow-auto">
          <table className="table table-sm">
            <tbody>
              {questions.map((item, index) => {
                const status = getQuestionStatus(item)
                return (
                  <tr className={`cursor-pointer hover:bg-base-200 ${index === current ? 'bg-primary/10' : ''}`} key={item.id} onClick={() => onJump(index)}>
                    <td className="w-24 font-bold">Q: {index + 1}</td><td>{item.question?.questionId || item.questionId}</td><td className="text-right"><span className={`inline-block size-2.5 rounded-full ${status.className}`} aria-label={status.label} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default QuestionNavigator
