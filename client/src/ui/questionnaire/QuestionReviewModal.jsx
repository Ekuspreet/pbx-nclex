import { useEffect, useMemo, useRef, useState } from 'react'
import TestExplanation from '../../features/test/components/TestExplanation.jsx'
import TestQuestion from '../../features/test/components/TestQuestion.jsx'
import TestShell from '../../features/test/components/TestShell.jsx'
import QuestionNavigator from '../../features/test/components/QuestionNavigator.jsx'
import { ReviewBottomControls, ReviewNavbar, ReviewTopBar } from '../../features/test/components/ReviewChrome.jsx'
import { applyHighlightsToHtml } from '../../features/test/testUtils.js'
import { stripExhibitLink } from './questionHelpers.js'

const EMPTY_HIGHLIGHTS = []
const EMPTY_QUESTIONS = []
const QUESTION_TEXT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl']

function makeHighlight(selector, index) {
  return { id: `review-highlight-${index}`, selector }
}

export function QuestionReviewScreen({ answerState, canNext = false, canPrevious = false, current = 0, highlightText = '', initialHighlights = EMPTY_HIGHLIGHTS, onClose, onJump, onNext, onPrevious, question, questionCount = 1, questions = EMPTY_QUESTIONS, showResult = true }) {
  const [highlights, setHighlights] = useState([])
  const [textSize, setTextSize] = useState(1)
  const [theme, setTheme] = useState('nord')
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const nextHighlightId = useRef(1)

  useEffect(() => {
    setHighlights(initialHighlights.length > 0
      ? initialHighlights
      : highlightText
        ? [makeHighlight({ exact: highlightText, region: 'question' }, 0)]
        : [])
  }, [highlightText, initialHighlights, question?.id, question?.questionId])

  useEffect(() => {
    if (!onClose) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const reviewedQuestion = useMemo(() => question ? {
    ...question,
    questionText: applyHighlightsToHtml(stripExhibitLink(question.questionText), highlights),
  } : null, [highlights, question])
  const explanation = applyHighlightsToHtml(question?.explanationText, highlights, 'explanation')
  const additionalText = applyHighlightsToHtml(question?.additionalText, highlights, 'additionalText')
  const hasStandards = Array.isArray(question?.standards) && question.standards.length > 0

  const addHighlight = (selector) => {
    const id = nextHighlightId.current
    nextHighlightId.current += 1
    setHighlights((current) => [...current, makeHighlight(selector, id)])
  }

  const removeHighlights = (ids) => {
    setHighlights((current) => current.filter((highlight) => !ids.includes(highlight.id)))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-base-100" data-theme={theme}>
        {!reviewedQuestion ? (
          <div className="grid h-full place-items-center p-6"><div className="alert alert-warning max-w-xl"><span>No question is attached to this record.</span></div></div>
        ) : (
          <TestShell
            mode="review"
            theme={theme}
            navigator={navigatorOpen ? <QuestionNavigator current={current} questions={questions} onClose={() => setNavigatorOpen(false)} onJump={(index) => { setNavigatorOpen(false); onJump?.(index) }} /> : null}
            topBar={<ReviewTopBar current={current} question={question} questionCount={questionCount} />}
            navbar={<ReviewNavbar textSize={textSize} onFullscreen={toggleFullscreen} onSetTextSize={setTextSize} onTheme={() => setTheme((value) => value === 'nord' ? 'dim' : 'nord')} />}
            bottomControls={onClose ? <ReviewBottomControls canNext={canNext} canPrevious={canPrevious} onClose={onClose} onNavigator={questions.length > 1 ? () => setNavigatorOpen(true) : undefined} onNext={onNext} onPrevious={onPrevious} /> : null}
          >
            <TestQuestion
              answerState={answerState || { value: '', answered: false, submitted: true }}
              constrained={Boolean(explanation || additionalText || hasStandards)}
              mode="review"
              question={reviewedQuestion}
              showResult={showResult}
              textSizeClass={QUESTION_TEXT_SIZES[textSize]}
              onAnswerChange={() => {}}
              onHighlight={addHighlight}
              onUnhighlight={removeHighlights}
            />
            {explanation || additionalText || hasStandards ? (
              <TestExplanation
                additionalHtml={additionalText}
                html={explanation}
                textSizeClass={QUESTION_TEXT_SIZES[textSize]}
                onHighlight={addHighlight}
                onUnhighlight={removeHighlights}
                standards={question.standards || []}
              />
            ) : null}
          </TestShell>
        )}
    </div>
  )
}

function QuestionReviewModal(props) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-neutral/60 p-3 text-base-content" data-theme="nord" role="dialog" aria-modal="true" aria-label="Question review">
      <div className="h-[88vh] w-[96vw] max-w-7xl overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-xl">
        <QuestionReviewScreen {...props} />
      </div>
    </div>
  )
}

export default QuestionReviewModal
