import McqQuestionPage from '../../pages/questionnaire/questionTypes/McqQuestionPage.jsx'
import QuestionSubmitButton from './QuestionSubmitButton.jsx'
import { getInitialAnswerValue, hasAnswer } from './questionHelpers.js'

const MCQ_FORMAT_TYPE_ID = 1
const MCQ_QUESTION_TYPE_ID = 1

function isMcqQuestion(question) {
  return Number(question?.formatTypeId) === MCQ_FORMAT_TYPE_ID
    && Number(question?.questionTypeId ?? MCQ_QUESTION_TYPE_ID) === MCQ_QUESTION_TYPE_ID
}

function QuestionRenderer({ question, answerState, submitLabel = 'Submit', onAnswerChange, onSubmit }) {
  if (!question) {
    return <div className="alert alert-warning">No question available.</div>
  }

  if (!isMcqQuestion(question)) {
    return <div className="alert alert-warning">This question is unavailable.</div>
  }

  const submitted = Boolean(answerState?.submitted)
  const value = answerState?.value ?? getInitialAnswerValue()
  const canSubmit = hasAnswer(value) && !submitted

  return (
    <div className="min-h-0 flex-1">
      <McqQuestionPage
        question={question}
        answer={value}
        submitted={submitted}
        onChange={onAnswerChange}
      />
      <QuestionSubmitButton disabled={!canSubmit} label={submitLabel} onSubmit={onSubmit} />
    </div>
  )
}

export default QuestionRenderer
