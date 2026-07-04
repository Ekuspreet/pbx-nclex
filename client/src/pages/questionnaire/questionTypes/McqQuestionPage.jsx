import AnswerIndicator from '../../../ui/questionnaire/AnswerIndicator.jsx'
import ReferenceHtml from '../../../ui/questionnaire/ReferenceHtml.jsx'
import { getCorrectAnswer, stripExhibitLink } from '../../../ui/questionnaire/questionHelpers.js'

function McqQuestionPage({ question, answer, submitted, onChange }) {
  const correctAnswer = getCorrectAnswer(question)

  return (
    <div id={`mcq-${question.questionId}`} className="h-full min-h-0">
      <div className="p-1">
        <ReferenceHtml
          as="p"
          className="mt-2 text-sm font-semibold"
          html={stripExhibitLink(question.questionText)}
        />
        <div className="form-control ml-2 mt-2 flex flex-col space-y-1">
          {(question.answerChoiceList || []).map((choice, index) => {
            const isCorrect = String(choice.choiceNumber) === correctAnswer
            const isSelected = String(choice.choiceNumber) === String(answer ?? '')
            const showIndicator = submitted && (isCorrect || isSelected)

            return (
              <label className="flex cursor-pointer items-center justify-start gap-2" data-choice={choice.choiceNumber} key={choice.choiceNumber}>
                <AnswerIndicator show={showIndicator} correct={isCorrect} />
                <input
                  type="radio"
                  name={`answer-${question.questionId}`}
                  className="radio radio-neutral radio-xs"
                  value={choice.choiceNumber}
                  checked={isSelected}
                  onChange={() => onChange(String(choice.choiceNumber))}
                  disabled={submitted}
                />
                <span className="ml-2">{index + 1}.</span>
                <span className="label-text text-sm" dangerouslySetInnerHTML={{ __html: choice.choice }} />
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default McqQuestionPage
