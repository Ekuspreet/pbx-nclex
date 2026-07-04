import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createFeedback,
  createHighlight,
  createNote,
  getTest,
  listHighlights,
  listNotes,
  saveTestAnswer,
  submitTest,
  updateTestStatus,
  updateTestTimer,
} from '../services/studyAdapter.js'
import ExplanationPanel from '../ui/questionnaire/ExplanationPanel.jsx'
import QuestionRenderer from '../ui/questionnaire/QuestionRenderer.jsx'

function formatTime(ms) {
  const safeMs = Math.max(0, ms || 0)
  const totalSeconds = Math.floor(safeMs / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyHighlightsToHtml(html, highlights = []) {
  let nextHtml = html || ''

  for (const highlight of highlights) {
    const exact = highlight.selector?.exact
    if (!exact) continue

    const pattern = new RegExp(escapeRegExp(exact), 'i')
    nextHtml = nextHtml.replace(pattern, `<mark data-highlighted="true" class="rounded bg-warning/50 px-0.5">${exact}</mark>`)
  }

  return nextHtml
}

const MCQ_FORMAT_TYPE_ID = 1
const MCQ_QUESTION_TYPE_ID = 1

function isMcqTestQuestion(item) {
  return Number(item?.question?.formatTypeId) === MCQ_FORMAT_TYPE_ID
    && Number(item?.question?.questionTypeId ?? MCQ_QUESTION_TYPE_ID) === MCQ_QUESTION_TYPE_ID
}

function getInitialQuestionIndex(questions, currentPosition = 0) {
  if (!questions.length) return 0

  const exactIndex = questions.findIndex((item) => item.position === currentPosition)
  if (exactIndex >= 0) return exactIndex

  const nextIndex = questions.findIndex((item) => item.position > currentPosition)
  return nextIndex >= 0 ? nextIndex : questions.length - 1
}

function TestTopBar({ current, percent, question, questionCount, timeMs }) {
  return (
    <div className="grid grid-cols-3 items-center bg-base-300 px-2 py-1 shadow-sm">
      <div className="flex flex-col font-bold">
        <p>NCLEX-RN</p>
        <p>READINESS ASSESSMENT</p>
      </div>
      <div className="flex flex-col justify-self-center">
        <p className="cursor-pointer text-sm font-bold">QID : {question?.question?.questionId || 'N/A'}</p>
      </div>
      <div className="flex flex-col justify-self-end text-right text-sm font-bold">
        <p>Time : {formatTime(timeMs)}</p>
        <p>Question : {questionCount ? current + 1 : 0} of {questionCount}</p>
        <p>Percentage : {percent}%</p>
      </div>
    </div>
  )
}

function TestSubNav({ marked, onCalculator, onFeedback, onFullscreen, onHighlight, onMark, onNotes, onTheme }) {
  return (
    <div className="flex justify-between bg-base-200 text-lg">
      <div className="flex items-stretch font-semibold">
        <button type="button" className="flex place-items-center gap-1 border-r border-base-content/60 p-2" onClick={onNotes}>
          <span className="material-symbols-outlined">add_notes</span> Notes
        </button>
        <button type="button" className="flex place-items-center gap-1 border-r border-base-content/60 p-2" onClick={onCalculator}>
          <span className="material-symbols-outlined">calculate</span> Calculator
        </button>
        <button type="button" className="flex place-items-center gap-1 border-r border-base-content/60 p-2" onClick={onFeedback}>
          <span className="material-symbols-outlined">feedback</span> Feedback
        </button>
        <button type="button" className="flex place-items-center gap-1 border-r border-base-content/60 p-2" onClick={onHighlight}>
          <span className="material-symbols-outlined">ink_highlighter</span> Highlight
        </button>
      </div>
      <div className="flex items-stretch font-semibold">
        <button type="button" className="flex place-items-center border-l border-base-content/60 p-2" onClick={onFullscreen}>
          <span className="material-symbols-outlined">fullscreen</span>
        </button>
        <button type="button" className="flex place-items-center border-l border-base-content/60 p-2" onClick={onTheme}>
          <span className="material-symbols-outlined">contrast</span>
        </button>
        <button type="button" className={`border-l border-base-content/60 p-2 ${marked ? 'bg-warning/30' : ''}`} onClick={onMark}>
          Mark for Review
        </button>
      </div>
    </div>
  )
}

function TestFooter({ canNext, canPrevious, onEnd, onNavigator, onNext, onPause, onPrevious }) {
  return (
    <div className="flex justify-between bg-base-200 text-lg">
      <div className="flex items-stretch font-semibold">
        <button type="button" className="flex cursor-pointer place-items-center gap-1 border-r border-base-content/60 p-2" onClick={onEnd}>
          <span className="material-symbols-outlined">stop</span> End
        </button>
        <button type="button" className="flex cursor-pointer place-items-center gap-1 border-r border-base-content/60 p-2" onClick={onPause}>
          <span className="material-symbols-outlined">pause</span> Pause
        </button>
      </div>

      <div className="flex items-stretch font-semibold">
        <button type="button" className="flex cursor-pointer place-items-center gap-1 border-l border-base-content/60 p-2" disabled={!canPrevious} onClick={onPrevious}>
          <span className="material-symbols-outlined">arrow_back</span> Previous
        </button>
        <button type="button" className="flex cursor-pointer place-items-center gap-1 border-l border-base-content/60 p-2" onClick={onNavigator}>
          <span className="material-symbols-outlined">search</span> Navigator
        </button>
        <button type="button" className="flex cursor-pointer place-items-center gap-1 border-l border-base-content/60 p-2" disabled={!canNext} onClick={onNext}>
          Next <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

function QuestionNavigator({ current, onClose, onJump, questions }) {
  return (
    <aside className="w-72 overflow-y-auto border-r border-base-content/20 bg-base-100">
      <div className="flex items-center justify-between border-b border-base-300 p-3">
        <h2 className="font-bold">Questions List</h2>
        <button className="btn btn-ghost btn-square btn-sm" type="button" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="grid gap-2 p-3">
        {questions.map((item, index) => {
          const statusClass = index === current
            ? 'btn-primary text-primary-content'
            : item.markedForReview
              ? 'btn-warning'
              : item.answered
                ? 'btn-success'
                : item.visited
                  ? 'btn-outline'
                  : 'btn-ghost'

          return (
            <button className={`btn btn-sm justify-start ${statusClass}`} key={item.id} type="button" onClick={() => onJump(index)}>
              Q: {index + 1}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/60 p-4">
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-base-100 p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-h3">{title}</h2>
          <button className="btn btn-ghost btn-square btn-sm" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function NotesModal({ onClose, onSaved, questionId, testId }) {
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState({ title: '', content: '' })

  useEffect(() => {
    listNotes({ testId, questionId }).then((payload) => setNotes(payload.notes || []))
  }, [questionId, testId])

  const submit = async (event) => {
    event.preventDefault()
    await createNote({ testId, questionId, ...form })
    setForm({ title: '', content: '' })
    const payload = await listNotes({ testId, questionId })
    setNotes(payload.notes || [])
    onSaved()
  }

  return (
    <Modal title="Notes" onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <input className="input input-bordered" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <textarea className="textarea textarea-bordered min-h-32" placeholder="Content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        <button className="btn btn-primary" disabled={!form.title || !form.content} type="submit">Save Note</button>
      </form>
      <div className="mt-4 grid gap-2">
        {notes.map((note) => (
          <article className="rounded border border-base-300 p-3" key={note.id}>
            <h3 className="font-bold">{note.title}</h3>
            <p className="text-sm text-muted">{note.content}</p>
          </article>
        ))}
      </div>
    </Modal>
  )
}

function FeedbackModal({ onClose, questionId, testId }) {
  const [form, setForm] = useState({ subject: 'Question feedback', message: '' })
  const [saved, setSaved] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    await createFeedback({ testId, questionId, ...form })
    setSaved(true)
  }

  return (
    <Modal title="Feedback" onClose={onClose}>
      {saved ? (
        <div className="alert alert-success"><span>Feedback submitted.</span></div>
      ) : (
        <form className="grid gap-3" onSubmit={submit}>
          <input className="input input-bordered" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
          <textarea className="textarea textarea-bordered min-h-40" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          <button className="btn btn-primary" disabled={!form.message} type="submit">Send</button>
        </form>
      )}
    </Modal>
  )
}

function CalculatorModal({ onClose }) {
  const [display, setDisplay] = useState('')
  const press = (value) => setDisplay((current) => `${current}${value}`)
  const clear = () => setDisplay('')
  const calculate = () => {
    try {
      if (!/^[\d+\-*/().\s]+$/.test(display)) return
      setDisplay(String(Function(`"use strict"; return (${display})`)()))
    } catch {
      setDisplay('Error')
    }
  }

  return (
    <Modal title="Calculator" onClose={onClose}>
      <input className="input input-bordered mb-3 w-full text-right text-xl" readOnly value={display} />
      <div className="grid grid-cols-4 gap-2">
        {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map((value) => (
          <button className="btn" key={value} type="button" onClick={value === '=' ? calculate : () => press(value)}>{value}</button>
        ))}
        <button className="btn btn-outline col-span-4" type="button" onClick={clear}>Clear</button>
      </div>
    </Modal>
  )
}

function TestPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', test: null, questions: [] })
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [theme, setTheme] = useState('nord')
  const [timeMs, setTimeMs] = useState(0)
  const [highlights, setHighlights] = useState([])
  const lastSavedTimer = useRef(0)

  const currentQuestion = state.questions[current]
  const explanationOpen = Boolean(currentQuestion?.checkedAt && state.test?.showRationales)
  const percent = useMemo(() => {
    if (!state.questions.length) return 0
    const answered = state.questions.filter((item) => item.answered || answers[item.questionId]?.value).length
    return Math.round((answered / state.questions.length) * 100)
  }, [answers, state.questions])

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

  const addHighlightFromSelection = async () => {
    const exact = window.getSelection()?.toString().trim()
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
    const payload = await submitTest(testId)
    navigate(`/tests/${payload.test.id}/result`)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  if (state.loading) {
    return <main className="grid min-h-screen place-items-center bg-base-100" data-theme="nord"><span className="loading loading-spinner loading-lg text-primary" /></main>
  }

  if (state.error) {
    return <main className="grid min-h-screen place-items-center bg-base-100 p-6" data-theme="nord"><div className="alert alert-error max-w-xl"><span>{state.error}</span></div></main>
  }

  if (!currentQuestion?.question) {
    return (
      <main className="grid min-h-screen place-items-center bg-base-100 p-6" data-theme={theme}>
        <div className="alert alert-warning max-w-xl">
          <span>No MCQ questions are available for this test.</span>
        </div>
      </main>
    )
  }

  const highlightedQuestion = {
    ...currentQuestion.question,
    questionText: applyHighlightsToHtml(currentQuestion.question.questionText, highlights),
  }

  return (
    <div className="flex h-screen bg-base-100 text-base-content" data-theme={theme}>
      {navigatorOpen ? (
        <QuestionNavigator
          current={current}
          questions={state.questions}
          onClose={() => setNavigatorOpen(false)}
          onJump={jumpTo}
        />
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col border-l border-base-content/20">
        <TestTopBar
          current={current}
          percent={percent}
          question={currentQuestion}
          questionCount={state.questions.length}
          timeMs={timeMs}
        />
        <TestSubNav
          marked={Boolean(currentQuestion?.markedForReview)}
          onCalculator={() => setModal('calculator')}
          onFeedback={() => setModal('feedback')}
          onFullscreen={toggleFullscreen}
          onHighlight={addHighlightFromSelection}
          onMark={toggleMark}
          onNotes={() => setModal('notes')}
          onTheme={() => setTheme((value) => value === 'nord' ? 'dim' : 'nord')}
        />

        <section className="flex min-h-0 flex-1 overflow-hidden p-2">
          <div className={`${explanationOpen ? 'max-w-4/5' : ''} min-h-0 flex-1 overflow-y-auto`}>
            <QuestionRenderer
              answerState={answers[currentQuestion.questionId]}
              question={highlightedQuestion}
              submitLabel={state.test.tutorMode ? 'Check' : 'Save'}
              onAnswerChange={(value) => setAnswers((currentAnswers) => ({
                ...currentAnswers,
                [currentQuestion.questionId]: {
                  value,
                  submitted: false,
                },
              }))}
              onSubmit={saveAnswer}
            />
          </div>
          {explanationOpen ? (
            <ExplanationPanel className="ml-3 flex-1 border-l border-base-300 pl-3" html={currentQuestion.question.explanationText} />
          ) : null}
        </section>

        <TestFooter
          canNext={current < state.questions.length - 1}
          canPrevious={current > 0}
          onEnd={endTest}
          onNavigator={() => setNavigatorOpen((value) => !value)}
          onNext={() => jumpTo(Math.min(state.questions.length - 1, current + 1))}
          onPause={() => navigate('/home')}
          onPrevious={() => jumpTo(Math.max(0, current - 1))}
        />
      </main>

      {modal === 'notes' ? (
        <NotesModal
          questionId={currentQuestion.questionId}
          testId={testId}
          onClose={() => setModal(null)}
          onSaved={() => {}}
        />
      ) : null}
      {modal === 'feedback' ? (
        <FeedbackModal questionId={currentQuestion.questionId} testId={testId} onClose={() => setModal(null)} />
      ) : null}
      {modal === 'calculator' ? <CalculatorModal onClose={() => setModal(null)} /> : null}
    </div>
  )
}

export default TestPage
