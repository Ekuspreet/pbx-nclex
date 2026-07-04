function QuestionSubmitButton({ disabled, label = 'Submit', onSubmit }) {
  return (
    <button
      className="btn btn-xs m-2 rounded-none btn-primary text-base-300"
      onClick={onSubmit}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  )
}

export default QuestionSubmitButton
