function QuestionSubmitButton({ disabled, label = 'Submit', onSubmit }) {
  return (
    <button
      className="mt-4 ml-2 h-8 w-[120px] bg-test-toolbar text-sm font-bold text-test-bar-content disabled:cursor-not-allowed"
      onClick={onSubmit}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  )
}

export default QuestionSubmitButton
