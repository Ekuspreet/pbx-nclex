function QuestionNavigator({ current, onClose, onJump, questions }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-base-100 shadow-2xl" role="dialog" aria-modal="true" aria-label="Question navigator">
        <header className="flex items-center justify-between bg-test-bar px-4 py-3 font-bold text-test-bar-content"><span>Questions List</span><button type="button" onClick={onClose}><span className="material-symbols-outlined">close</span></button></header>
        <div className="flex gap-4 border-b border-base-300 px-4 py-2 text-xs"><span><i className="mr-1 inline-block size-2.5 rounded-full bg-success" />Done</span><span><i className="mr-1 inline-block size-2.5 rounded-full bg-error" />Omitted</span><span><i className="mr-1 inline-block size-2.5 rounded-full bg-base-content/40" />Pending</span></div>
        <div className="overflow-auto">
          <table className="table table-sm">
            <tbody>
              {questions.map((item, index) => (
                <tr className={`cursor-pointer hover:bg-base-200 ${index === current ? 'bg-primary/10' : ''}`} key={item.id} onClick={() => onJump(index)}>
                  <td className="w-24 font-bold">Q: {index + 1}</td><td>{item.question?.questionId || item.questionId}</td><td className="text-right"><span className={`status ${item.answered ? 'status-success' : item.visited ? 'status-error' : ''}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default QuestionNavigator
