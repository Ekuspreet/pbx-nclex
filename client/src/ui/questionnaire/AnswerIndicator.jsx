function AnswerIndicator({ show, correct, className = '' }) {
  if (!show) {
    return <span className={`answer-indicator ${className}`} />
  }

  return (
    <span className={`answer-indicator ${className}`} style={{ color: correct ? 'green' : 'red' }}>
      {correct ? '✓' : '✕'}
    </span>
  )
}

export default AnswerIndicator
