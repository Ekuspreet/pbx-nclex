function AnswerIndicator({ show, correct, className = '' }) {
  if (!show) {
    return <span className={`answer-indicator ${className}`} />
  }

  return (
    <span className={`answer-indicator material-symbols-outlined ${correct ? 'text-success' : 'text-error'} ${className}`}>
      {correct ? 'check' : 'close'}
    </span>
  )
}

export default AnswerIndicator
