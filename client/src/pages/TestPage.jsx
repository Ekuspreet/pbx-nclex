import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import {
  createHighlight,
  getTest,
  listHighlights,
  saveTestAnswer,
  submitTest,
  updateTestStatus,
  updateTestTimer,
} from '../services/studyAdapter.js'
import QuestionNavigator from '../features/test/components/QuestionNavigator.jsx'
import TestBottomControls from '../features/test/components/TestBottomControls.jsx'
import TestExplanation from '../features/test/components/TestExplanation.jsx'
import TestModals from '../features/test/components/TestModals.jsx'
import TestNavbar from '../features/test/components/TestNavbar.jsx'
import TestQuestion from '../features/test/components/TestQuestion.jsx'
import TestShell, { TestPageState } from '../features/test/components/TestShell.jsx'
import TestTopBar from '../features/test/components/TestTopBar.jsx'
import { applyHighlightsToHtml, getInitialQuestionIndex, isMcqTestQuestion } from '../features/test/testUtils.js'

const QUESTION_TEXT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl']

function TestPage() {
  const auth = useAuth()
  const { testId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', test: null, questions: [] })
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [theme, setTheme] = useState('nord')
  const [textSize, setTextSize] = useState(1)
  const [timeMs, setTimeMs] = useState(0)
  const [highlights, setHighlights] = useState([])
  const lastSavedTimer = useRef(0)

  const currentQuestion = state.questions[current]
  const explanationOpen = Boolean(currentQuestion?.checkedAt && state.test?.showRationales)
  useEffect(() => {
    let active = true

    getTest(testId)
      .then((payload) => {
        if (!active) return
        const questions = (payload.questions || []).filter(isMcqTestQuestion)
        const nextAnswers = {}
        for (const item of questions) {
          nextAnswers[item.questionId] = {
            value: item.answer ?? '',
            submitted: Boolean(payload.test.status === 'completed' || (payload.test.tutorMode && item.checkedAt)),
          }
        }
        setAnswers(nextAnswers)
        setCurrent(getInitialQuestionIndex(questions, payload.test.currentPosition || 0))
        setTimeMs(payload.test.timed ? payload.test.remainingMs : payload.test.elapsedMs)
        setState({ loading: false, error: '', test: payload.test, questions })
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message, test: null, questions: [] })
      })

    return () => {
      active = false
    }
  }, [testId])

  useEffect(() => {
    if (!currentQuestion) return
    listHighlights({ testId, questionId: currentQuestion.questionId }).then((payload) => setHighlights(payload.highlights || []))
  }, [currentQuestion, testId])

  useEffect(() => {
    if (!state.test || state.test.status === 'completed') return undefined
    const shouldPause = state.test.tutorMode && explanationOpen

    if (shouldPause) return undefined

    const timer = window.setInterval(() => {
      setTimeMs((value) => state.test.timed ? Math.max(0, value - 1000) : value + 1000)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [explanationOpen, state.test])

  useEffect(() => {
    if (!state.test || state.test.status === 'completed') return
    if (Math.abs(timeMs - lastSavedTimer.current) < 15000) return
    lastSavedTimer.current = timeMs
    updateTestTimer(testId, state.test.timed ? { remainingMs: timeMs } : { elapsedMs: timeMs }).catch(() => {})
  }, [state.test, testId, timeMs])

  const updateLocalQuestion = (questionId, patch) => {
    setState((currentState) => ({
      ...currentState,
      questions: currentState.questions.map((item) => (
        item.questionId === questionId ? { ...item, ...patch } : item
      )),
    }))
  }

  const saveAnswer = async () => {
    if (!currentQuestion) return

    const answerState = answers[currentQuestion.questionId]
    const payload = await saveTestAnswer(testId, {
      questionId: currentQuestion.questionId,
      answer: answerState?.value ?? '',
      position: currentQuestion.position,
    })

    updateLocalQuestion(currentQuestion.questionId, {
      ...payload.question,
      checkedAt: payload.question.checkedAt,
      answered: true,
    })
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.questionId]: {
        value: answerState?.value ?? '',
        submitted: Boolean(state.test.tutorMode),
      },
    }))
  }

  const jumpTo = async (index) => {
    const item = state.questions[index]
    if (!item) return

    setCurrent(index)
    setNavigatorOpen(false)
    updateLocalQuestion(item.questionId, { visited: true })
    await updateTestStatus(testId, {
      questionId: item.questionId,
      currentPosition: item.position,
      visited: true,
    })
  }

  const toggleMark = async () => {
    if (!currentQuestion) return

    const nextValue = !currentQuestion.markedForReview
    updateLocalQuestion(currentQuestion.questionId, { markedForReview: nextValue })
    await updateTestStatus(testId, {
      questionId: currentQuestion.questionId,
      markedForReview: nextValue,
    })
  }

  const addHighlight = async (exact) => {
    if (!exact || !currentQuestion) return
    await createHighlight({
      testId,
      questionId: currentQuestion.questionId,
      selector: { exact },
      color: 'yellow',
    })
    const payload = await listHighlights({ testId, questionId: currentQuestion.questionId })
    setHighlights(payload.highlights || [])
  }

  const endTest = async () => {
    if (!window.confirm('Are you sure you want to end this test?')) return

    const payload = await submitTest(testId)
    navigate(`/tests/${payload.test.id}/result`)
  }

  const pauseTest = () => {
    if (!window.confirm('Are you sure you want to pause and close this test?')) return

    navigate('/home')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  if (state.loading) {
    return <TestPageState><span className="loading loading-spinner loading-lg text-primary" /></TestPageState>
  }

  if (state.error) {
    return <TestPageState><div className="alert alert-error max-w-xl"><span>{state.error}</span></div></TestPageState>
  }

  if (!currentQuestion?.question) {
    return (
      <TestPageState theme={theme}>
        <div className="alert alert-warning max-w-xl">
          <span>No MCQ questions are available for this test.</span>
        </div>
      </TestPageState>
    )
  }

  const highlightedQuestion = {
    ...currentQuestion.question,
    questionText: applyHighlightsToHtml(currentQuestion.question.questionText, highlights),
  }

  return (
    <TestShell
      theme={theme}
      navigator={navigatorOpen ? (
        <QuestionNavigator
          current={current}
          questions={state.questions}
          onClose={() => setNavigatorOpen(false)}
          onJump={jumpTo}
        />
      ) : null}
      topBar={(
        <TestTopBar
          current={current}
          question={currentQuestion}
          questionCount={state.questions.length}
          test={state.test}
          timeMs={timeMs}
          userName={auth.user?.name}
        />
      )}
      navbar={(
        <TestNavbar
          marked={Boolean(currentQuestion?.markedForReview)}
          onCalculator={() => setModal('calculator')}
          onDecreaseText={() => setTextSize((size) => Math.max(0, size - 1))}
          onFeedback={() => setModal('feedback')}
          onFullscreen={toggleFullscreen}
          onIncreaseText={() => setTextSize((size) => Math.min(3, size + 1))}
          onMark={toggleMark}
          onNotes={() => setModal('notes')}
          onTheme={() => setTheme((value) => value === 'nord' ? 'dim' : 'nord')}
          textSize={textSize}
        />
      )}
      bottomControls={(
        <TestBottomControls
          canNext={current < state.questions.length - 1}
          canPrevious={current > 0}
          isLast={current === state.questions.length - 1}
          onEnd={endTest}
          onFinish={endTest}
          onNavigator={() => setNavigatorOpen((value) => !value)}
          onNext={() => jumpTo(Math.min(state.questions.length - 1, current + 1))}
          onPause={pauseTest}
          onPrevious={() => jumpTo(Math.max(0, current - 1))}
        />
      )}
      modals={(
        <TestModals
          activeModal={modal}
          onClose={() => setModal(null)}
          questionId={currentQuestion.questionId}
          testId={testId}
        />
      )}
    >
      <TestQuestion
        answerState={answers[currentQuestion.questionId]}
        constrained={explanationOpen}
        question={highlightedQuestion}
        submitLabel={state.test.tutorMode ? 'Check' : 'Save'}
        textSizeClass={QUESTION_TEXT_SIZES[textSize]}
        onHighlight={addHighlight}
        onAnswerChange={(value) => setAnswers((currentAnswers) => ({
          ...currentAnswers,
          [currentQuestion.questionId]: { value, submitted: false },
        }))}
        onSubmit={saveAnswer}
      />
      {explanationOpen ? (
        <TestExplanation
          html={currentQuestion.question.explanationText}
          textSizeClass={QUESTION_TEXT_SIZES[textSize]}
        />
      ) : null}
    </TestShell>
  )
}

export default TestPage
