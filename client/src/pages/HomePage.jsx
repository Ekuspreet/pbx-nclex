import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { brand, pricing } from '../content/landing/index.js'
import {
  createTest,
  deleteHighlight,
  deleteNote,
  getDashboard,
  getFeedback,
  getQuestionStats,
  listFeedback,
  listHighlights,
  listNotes,
  listTests,
  replyFeedback,
} from '../services/studyAdapter.js'
import DrawerShell, { AccountIdentity, AccountPanel } from '../ui/layout/DrawerShell.jsx'
import QuestionPreviewModal from '../ui/questionnaire/QuestionPreviewModal.jsx'

const navGroups = [
  {
    label: 'Tests',
    items: [
      { label: 'Dashboard', href: '/home', icon: 'dashboard', end: true },
      { label: 'Create Test', href: '/tests/create', icon: 'add_circle' },
      { label: 'Tests', href: '/tests', icon: 'fact_check' },
    ],
  },
  {
    label: 'Study Tools',
    items: [
      { label: 'Notes', href: '/notes', icon: 'notes' },
      { label: 'Highlights', href: '/highlights', icon: 'stylus_note' },
      { label: 'Feedback', href: '/feedback', icon: 'feedback' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Pricing', href: '/pricing', icon: 'workspace_premium' },
      { label: 'Payment', href: '/payment', icon: 'payments' },
    ],
  },
]

const pageContent = {
  dashboard: { eyebrow: 'Dashboard', title: 'Statistics' },
  createTest: { eyebrow: 'Tests', title: 'Create Test' },
  tests: { eyebrow: 'Tests', title: 'Tests' },
  pricing: { eyebrow: 'Pricing', title: 'Pricing' },
  payment: { eyebrow: 'Payment', title: 'Upgrade to Plus' },
  feedback: { eyebrow: 'Feedback', title: 'Feedback' },
  highlights: { eyebrow: 'Highlights', title: 'Highlights' },
  notes: { eyebrow: 'Notes', title: 'Notes' },
}

function getPageContent(page) {
  return pageContent[page] ?? pageContent.dashboard
}

function getUserPlan(user) {
  return String(user?.plan || user?.subscriptionTier || 'free').toLowerCase() === 'plus'
    ? 'plus'
    : 'free'
}

function getPlanBadgeClass(plan) {
  return plan === 'plus' ? 'badge-primary' : 'badge-outline'
}

function LoadingState() {
  return (
    <div className="grid min-h-48 place-items-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="alert alert-error">
      <span>{message}</span>
    </div>
  )
}

function asCount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function getPercent(value, total) {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function ProgressRing({ label, value, color = 'text-primary' }) {
  const progress = Math.min(Math.max(asCount(value), 0), 100)
  return (
    <div className="relative mx-auto size-40 shrink-0 md:size-44">
      <svg aria-label={`${label}: ${progress}%`} className="size-full -rotate-90" role="img" viewBox="0 0 40 40">
        <circle cx="20" cy="20" fill="none" r="16" stroke="currentColor" strokeWidth="2.5" className="text-base-300" />
        <circle cx="20" cy="20" fill="none" pathLength="100" r="16" stroke="currentColor" strokeDasharray={`${progress} ${100 - progress}`} strokeLinecap="butt" strokeWidth="2.5" className={color} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-3xl text-base-content/70">{progress}%</span>
      </div>
    </div>
  )
}

function MetricList({ title, rows }) {
  return (
    <div className="min-w-0 flex-1">
      <h2 className="text-h6 mb-3">{title}</h2>
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div className="flex items-center justify-between gap-4" key={row.label}>
            <dt className="text-muted">{row.label}</dt>
            <dd><span className="badge badge-ghost badge-sm min-w-7">{row.value}</span></dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function DashboardPageContent() {
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    let active = true

    getDashboard()
      .then((data) => {
        if (active) setState({ loading: false, error: '', data })
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message, data: null })
      })

    return () => {
      active = false
    }
  }, [])

  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} />

  const { data } = state
  const total = asCount(data.totalQuestions)
  const used = asCount(data.attemptedQuestions)
  const correct = asCount(data.correctQuestions)
  const incorrect = asCount(data.incorrectQuestions)
  const omitted = Math.max(used - correct - incorrect, 0)
  const performanceTotal = correct + incorrect + omitted

  return (
    <div className="grid gap-10">
      <section className="grid gap-10 xl:grid-cols-2 xl:gap-16" aria-label="Statistics summary">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <ProgressRing color="text-success/40" label="Performance" value={getPercent(correct, performanceTotal).replace('%', '')} />
          <MetricList title="Performance" rows={[
            { label: 'Correct', value: correct },
            { label: 'Incorrect', value: incorrect },
            { label: 'Omitted', value: omitted },
            { label: 'Scored Points', value: correct },
            { label: 'Max Points', value: performanceTotal },
          ]} />
        </div>
        <div className="flex flex-col-reverse items-center gap-8 sm:flex-row">
          <MetricList title="QBank Usage" rows={[
            { label: 'Used Questions', value: used },
            { label: 'Unused Questions', value: Math.max(total - used, 0) },
            { label: 'Total Questions', value: total },
          ]} />
          <ProgressRing color="text-info/40" label="QBank usage" value={getPercent(used, total).replace('%', '')} />
        </div>
      </section>

      <StatTable subjects={data.subjects} systems={data.systems} />
    </div>
  )
}

function StatTable({ subjects = [], systems = [] }) {
  const [activeTab, setActiveTab] = useState('subjects')
  const rows = activeTab === 'subjects' ? subjects : systems

  return (
    <section className="min-w-0">
      <div className="tabs tabs-border mb-4" role="tablist" aria-label="Statistics category">
        {['subjects', 'systems'].map((tab) => (
          <button className={`tab px-6 capitalize ${activeTab === tab ? 'tab-active' : ''}`} key={tab} onClick={() => setActiveTab(tab)} role="tab" type="button">{tab}</button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-100">
            <tr>
              <th>Name</th>
              <th>Usage</th>
              <th>Scored / Max</th>
              <th>Correct Q</th>
              <th>Incorrect Q</th>
              <th>Omitted Q</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="min-w-64">
                  <span>{row.label}</span>
                  <progress className="progress progress-success mt-2 block h-1.5 w-full" max={row.totalQuestions || 1} value={row.attemptedQuestions} />
                </td>
                <td>{row.attemptedQuestions}/{row.totalQuestions}</td>
                <td>{row.correctQuestions} / {row.totalQuestions} ({getPercent(row.correctQuestions, row.totalQuestions)})</td>
                <td>{row.correctQuestions} ({getPercent(row.correctQuestions, row.attemptedQuestions)})</td>
                <td>{row.incorrectQuestions} ({getPercent(row.incorrectQuestions, row.attemptedQuestions)})</td>
                <td>{Math.max(row.attemptedQuestions - row.correctQuestions - row.incorrectQuestions, 0)} ({getPercent(Math.max(row.attemptedQuestions - row.correctQuestions - row.incorrectQuestions, 0), row.attemptedQuestions)})</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6">No statistics available yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CreateTestPageContent() {
  const navigate = useNavigate()
  const [statsState, setStatsState] = useState({ loading: true, error: '', data: null })
  const [form, setForm] = useState({
    tutorMode: true,
    timed: false,
    showRationales: true,
    questionCount: 10,
    subjects: [],
    systems: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let active = true

    getQuestionStats()
      .then((data) => {
        if (active) setStatsState({ loading: false, error: '', data })
      })
      .catch((error) => {
        if (active) setStatsState({ loading: false, error: error.message, data: null })
      })

    return () => {
      active = false
    }
  }, [])

  const toggle = (group, key) => {
    setForm((current) => {
      const values = new Set(current[group])
      if (values.has(key)) values.delete(key)
      else values.add(key)
      return { ...current, [group]: Array.from(values) }
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const payload = await createTest({
        ...form,
        questionCount: Number(form.questionCount),
      })
      navigate(`/tests/${payload.test.id}`)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (statsState.loading) return <LoadingState />
  if (statsState.error) return <ErrorState message={statsState.error} />

  const totalQuestions = statsState.data.subjects.reduce((sum, option) => sum + asCount(option.totalQuestions), 0)
  const maxQuestions = Math.min(totalQuestions, 80)

  return (
    <form className="grid gap-8" onSubmit={submit}>
      {submitError ? <ErrorState message={submitError} /> : null}

      <fieldset>
        <legend className="text-h6 mb-4">Test Mode</legend>
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.tutorMode} onChange={(event) => setForm({ ...form, tutorMode: event.target.checked })} />
            <span className="label-text">Tutor</span>
          </label>
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.timed} onChange={(event) => setForm({ ...form, timed: event.target.checked })} />
            <span className="label-text">Timed</span>
          </label>
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.showRationales} onChange={(event) => setForm({ ...form, showRationales: event.target.checked })} />
            <span className="label-text">Show Rationales</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-h6 mb-4 flex items-center gap-2">
          Question Mode
          <span className="tooltip tooltip-right" data-tip="Question history filters will become available as you complete tests.">
            <span className="material-symbols-outlined text-info" aria-label="About question modes">info</span>
          </span>
        </legend>
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <QuestionModeOption count={totalQuestions} label="Unused" selected />
          <QuestionModeOption count={0} label="Incorrect" />
          <QuestionModeOption count={0} label="Marked" />
          <QuestionModeOption count={0} label="Omitted" />
          <QuestionModeOption count={0} label="Correct" />
        </div>
      </fieldset>

      <FilterPicker
        label="Subjects"
        options={statsState.data.subjects}
        selected={form.subjects}
        onSelectAll={() => setForm((current) => ({ ...current, subjects: [] }))}
        onToggle={(key) => toggle('subjects', key)}
      />
      <FilterPicker
        label="Systems"
        options={statsState.data.systems}
        selected={form.systems}
        onSelectAll={() => setForm((current) => ({ ...current, systems: [] }))}
        onToggle={(key) => toggle('systems', key)}
      />

      <footer className="surface-sticky -mx-4 mt-2 flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:justify-between md:-mx-8 md:px-8">
        <label className="form-control flex-row items-center gap-3">
          <span className="label-text whitespace-nowrap font-bold">No. of Questions</span>
          <input
            className="input input-bordered input-sm w-20 text-center"
            max={maxQuestions}
            min="1"
            type="number"
            value={form.questionCount}
            onChange={(event) => setForm({ ...form, questionCount: event.target.value })}
          />
          <span className="text-caption text-muted whitespace-nowrap">Max allowed <strong className="text-base-content">{maxQuestions}</strong></span>
        </label>
        <button className="btn btn-primary min-w-40" disabled={submitting || maxQuestions === 0} type="submit">
          {submitting ? <span className="loading loading-spinner loading-sm" /> : null}
          Generate Test
        </button>
      </footer>
    </form>
  )
}

function QuestionModeOption({ count, label, selected = false }) {
  return (
    <label className={`label justify-start gap-2 ${selected ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
      <input className="checkbox checkbox-primary checkbox-sm" checked={selected} disabled={!selected} readOnly type="checkbox" />
      <span className="label-text">{label}</span>
      <span className="badge badge-outline badge-sm">{count}</span>
    </label>
  )
}

function FilterPicker({ label, options = [], selected = [], onSelectAll, onToggle }) {
  return (
    <fieldset className="border-b border-base-300 pb-6 last:border-0">
      <legend className="text-h6 mb-3">Question {label}</legend>
      <label className="label mb-2 w-fit cursor-pointer justify-start gap-3">
        <input className="checkbox checkbox-primary checkbox-sm" checked={selected.length === 0} onChange={onSelectAll} type="checkbox" />
        <span className="label-text font-bold">{label}</span>
        <span className="badge badge-ghost badge-sm">{selected.length === 0 ? 'All' : selected.length}</span>
      </label>
      <div className="grid gap-x-12 gap-y-1 pl-0 sm:pl-7 md:grid-cols-2">
        {options.map((option) => (
          <label className="label min-w-0 cursor-pointer justify-start gap-3 py-2" key={option.key}>
            <input
              className="checkbox checkbox-primary checkbox-sm"
              checked={selected.includes(option.key)}
              type="checkbox"
              onChange={() => onToggle(option.key)}
            />
            <span className="label-text min-w-0 flex-1 truncate">{option.label}</span>
            <span className="badge badge-outline badge-sm">{option.totalQuestions}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function NotesPageContent() {
  return <RecordsTable kind="notes" loader={listNotes} remover={deleteNote} />
}

function HighlightsPageContent() {
  return <RecordsTable kind="highlights" loader={listHighlights} remover={deleteHighlight} />
}

function RecordsTable({ kind, loader, remover }) {
  const [state, setState] = useState({ loading: true, error: '', rows: [] })
  const [preview, setPreview] = useState(null)

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    loader()
      .then((payload) => setState({ loading: false, error: '', rows: payload[kind] || [] }))
      .catch((error) => setState({ loading: false, error: error.message, rows: [] }))
  }, [kind, loader])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (id) => {
    await remover(id)
    load()
  }

  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} />

  return (
    <section className="surface-raised rounded-lg border p-4">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Question</th>
              <th>{kind === 'notes' ? 'Title' : 'Highlighted Text'}</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row) => (
              <tr key={row.id}>
                <td>QID {row.question?.questionId || row.questionId}</td>
                <td>
                  <div className="max-w-xl">
                    <p className="font-bold">{kind === 'notes' ? row.title : row.selector?.exact}</p>
                    {kind === 'notes' ? <p className="line-clamp-2 text-sm text-muted">{row.content}</p> : null}
                  </div>
                </td>
                <td>{new Date(row.updatedAt).toLocaleString()}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-ghost btn-xs"
                      type="button"
                      disabled={!row.question}
                      title="Preview question"
                      onClick={() => setPreview({
                        question: row.question,
                        highlightText: kind === 'highlights' ? row.selector?.exact : '',
                      })}
                    >
                      <span className="material-symbols-outlined">visibility</span>
                      Preview
                    </button>
                    <button className="btn btn-ghost btn-xs" type="button" onClick={() => remove(row.id)}>
                      <span className="material-symbols-outlined">delete</span>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {state.rows.length === 0 ? (
              <tr>
                <td colSpan="4">No {kind} saved yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {preview ? <QuestionPreviewModal highlightText={preview.highlightText} question={preview.question} onClose={() => setPreview(null)} /> : null}
    </section>
  )
}

function FeedbackThreadModal({ onClose, onUpdated, threadId }) {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    getFeedback(threadId)
      .then((payload) => {
        if (active) setState({ loading: false, error: '', data: payload })
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message, data: null })
      })

    return () => {
      active = false
    }
  }, [threadId])

  const submitReply = async (event) => {
    event.preventDefault()
    const message = reply.trim()
    if (!message) return

    setSubmitting(true)
    setState((current) => ({ ...current, error: '' }))

    try {
      const payload = await replyFeedback(threadId, message)
      setState({ loading: false, error: '', data: payload })
      setReply('')
      if (payload.thread) onUpdated(payload.thread)
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setSubmitting(false)
    }
  }

  const thread = state.data?.thread
  const messages = state.data?.messages || []

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/60 p-3 sm:p-4">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-base-100 shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-base-300 p-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-primary">Feedback Thread</p>
            <h2 className="truncate text-xl font-black sm:text-2xl">{thread?.subject || 'Feedback'}</h2>
            {thread ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="badge badge-outline">{thread.status}</span>
                {thread.question ? <span className="badge badge-ghost">QID {thread.question.questionId}</span> : null}
              </div>
            ) : null}
          </div>
          <button className="btn btn-ghost btn-square btn-sm shrink-0" type="button" onClick={onClose} aria-label="Close feedback thread">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {state.loading ? <LoadingState /> : null}
          {state.error ? <ErrorState message={state.error} /> : null}
          {!state.loading && !state.error ? (
            <div className="grid gap-4">
              {messages.map((message) => {
                const fromUser = message.senderType === 'user'

                return (
                  <article className={`rounded-lg border p-3 ${fromUser ? 'bg-primary/5' : 'bg-base-200'}`} key={message.id}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className={`badge ${fromUser ? 'badge-primary' : 'badge-secondary'}`}>{fromUser ? 'You' : 'Admin'}</span>
                      <span className="text-xs text-muted">{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                  </article>
                )
              })}
              {messages.length === 0 ? <div className="alert alert-info"><span>No messages in this thread yet.</span></div> : null}
            </div>
          ) : null}
        </div>

        <form className="grid gap-3 border-t border-base-300 p-4" onSubmit={submitReply}>
          <textarea
            className="textarea textarea-bordered min-h-28"
            disabled={state.loading || submitting || thread?.status === 'closed'}
            placeholder={thread?.status === 'closed' ? 'This thread is closed.' : 'Write a reply'}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Close</button>
            <button className="btn btn-primary" disabled={state.loading || submitting || !reply.trim() || thread?.status === 'closed'} type="submit">
              {submitting ? <span className="loading loading-spinner loading-sm" /> : null}
              Send Reply
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FeedbackPageContent() {
  const [state, setState] = useState({ loading: true, error: '', rows: [] })
  const [previewQuestion, setPreviewQuestion] = useState(null)
  const [openThreadId, setOpenThreadId] = useState(null)

  useEffect(() => {
    listFeedback()
      .then((payload) => setState({ loading: false, error: '', rows: payload.feedback || [] }))
      .catch((error) => setState({ loading: false, error: error.message, rows: [] }))
  }, [])

  if (state.loading) return <LoadingState />

  const updateThreadRow = (thread) => {
    setState((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === thread.id ? { ...row, ...thread } : row)),
    }))
  }

  return (
    <div className="grid gap-6">
      <section className="surface-raised rounded-lg border p-4">
        <div className="mb-4">
          <h2 className="text-h3">Feedback Threads</h2>
          <p className="text-caption text-muted">Question feedback is submitted from the exam window.</p>
        </div>
        {state.error ? <ErrorState message={state.error} /> : null}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Question</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.rows.map((thread) => (
                <tr key={thread.id}>
                  <td>{thread.subject}</td>
                  <td><span className="badge badge-outline">{thread.status}</span></td>
                  <td>{thread.question ? `QID ${thread.question.questionId}` : '-'}</td>
                  <td>{new Date(thread.updatedAt).toLocaleString()}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-primary btn-xs" type="button" onClick={() => setOpenThreadId(thread.id)}>
                        <span className="material-symbols-outlined">forum</span>
                        Open
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        type="button"
                        disabled={!thread.question}
                        title="Preview question"
                        onClick={() => setPreviewQuestion(thread.question)}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                        Preview
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {state.rows.length === 0 ? (
                <tr>
                  <td colSpan="5">No feedback threads yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      {openThreadId ? (
        <FeedbackThreadModal
          threadId={openThreadId}
          onClose={() => setOpenThreadId(null)}
          onUpdated={updateThreadRow}
        />
      ) : null}
      {previewQuestion ? <QuestionPreviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} /> : null}
    </div>
  )
}

function TestsPageContent() {
  const [state, setState] = useState({ loading: true, error: '', tests: [] })

  useEffect(() => {
    listTests()
      .then((data) => setState({ loading: false, error: '', tests: data.tests || [] }))
      .catch((error) => setState({ loading: false, error: error.message, tests: [] }))
  }, [])

  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} />

  const incomplete = state.tests.filter((test) => test.status !== 'completed')
  const completed = state.tests.filter((test) => test.status === 'completed')

  return (
    <div className="grid gap-6">
      <TestsTable
        actionLabel="Continue"
        emptyMessage="No incomplete tests."
        tests={incomplete}
        title="Continue Tests"
        toHref={(test) => `/tests/${test.id}`}
      />
      <TestsTable
        actionLabel="Review"
        emptyMessage="No completed tests yet."
        tests={completed}
        title="Completed Tests"
        toHref={(test) => `/tests/${test.id}/result`}
      />
    </div>
  )
}

function TestsTable({ actionLabel, emptyMessage, tests, title, toHref }) {
  return (
    <section className="surface-raised rounded-lg border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-h3">{title}</h2>
          <p className="text-caption text-muted">
            {title === 'Continue Tests'
              ? 'Resume tests that were paused, interrupted, or left unfinished.'
              : 'Open completed tests to review your score and rationales.'}
          </p>
        </div>
        {title === 'Continue Tests' ? (
          <a className="btn btn-primary btn-sm" href="/tests/create">Create test</a>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Updated</th>
              <th>Status</th>
              <th>Questions</th>
              <th>Mode</th>
              <th>Score</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr key={test.id}>
                <td>{new Date(test.updatedAt).toLocaleString()}</td>
                <td><span className="badge badge-outline">{test.status}</span></td>
                <td>{test.questionCount}</td>
                <td>{test.tutorMode ? 'Tutor' : 'Test'} / {test.timed ? 'Timed' : 'Untimed'}</td>
                <td>{test.status === 'completed' ? `${test.scoreSummary?.percentage ?? 0}%` : '-'}</td>
                <td className="text-right">
                  <a className="btn btn-ghost btn-xs" href={toHref(test)}>{actionLabel}</a>
                </td>
              </tr>
            ))}
            {tests.length === 0 ? (
              <tr>
                <td colSpan="6">{emptyMessage}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function WorkspacePlanCard({ plan, currentPlan }) {
  const isCurrent = plan.key === currentPlan
  const href = plan.key === 'plus' ? '/payment' : '/home'

  return (
    <article className={`card surface-raised ${plan.featured ? 'border-primary shadow-md' : ''}`}>
      <div className="card-body p-md gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3">{plan.name}</h2>
          <span className={`badge ${isCurrent ? 'badge-success' : plan.featured ? 'badge-primary' : 'badge-outline'}`}>
            {isCurrent ? 'Current plan' : plan.badge}
          </span>
        </div>
        <p className="text-body text-muted">{plan.description}</p>
        <div className="grid gap-1 border-y border-base-300 py-4">
          <strong className="text-h3">{plan.price}</strong>
          <span className="text-caption text-muted font-bold">{plan.cadence}</span>
        </div>
        <ul className="rule-list">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <div className="card-actions mt-auto">
          {isCurrent ? (
            <button className="btn btn-outline" type="button" disabled>Current plan</button>
          ) : (
            <a className="btn btn-primary" href={href}>{plan.key === 'plus' ? 'Buy Plus' : 'Use Free'}</a>
          )}
        </div>
      </div>
    </article>
  )
}

function PricingPageContent({ currentPlan }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pricing.plans.map((plan) => (
        <WorkspacePlanCard currentPlan={currentPlan} key={plan.key} plan={plan} />
      ))}
    </div>
  )
}

function PaymentPageContent() {
  const plusPlan = pricing.plans.find((plan) => plan.key === 'plus')

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <article className="card surface-raised">
        <div className="card-body p-md gap-4">
          <p className="text-kicker">Selected plan</p>
          <h2 className="text-h3">{plusPlan.name}</h2>
          <p className="text-body text-muted">{plusPlan.description}</p>
          <ul className="rule-list">
            {plusPlan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </article>

      <article className="card surface-raised">
        <div className="card-body p-md gap-4">
          <p className="text-kicker">Checkout</p>
          <h2 className="text-2xl font-black">{plusPlan.price}</h2>
          <p className="text-body text-muted">{plusPlan.cadence}</p>
          <button className="btn btn-primary" type="button">Buy Plus</button>
        </div>
      </article>
    </section>
  )
}

function PageBody({ page, currentPlan }) {
  if (page === 'dashboard') return <DashboardPageContent />
  if (page === 'createTest') return <CreateTestPageContent />
  if (page === 'tests') return <TestsPageContent />
  if (page === 'feedback') return <FeedbackPageContent />
  if (page === 'highlights') return <HighlightsPageContent />
  if (page === 'notes') return <NotesPageContent />
  if (page === 'pricing') return <PricingPageContent currentPlan={currentPlan} />
  if (page === 'payment') return <PaymentPageContent />

  return <DashboardPageContent />
}

function HomePage({ page = 'dashboard' }) {
  const auth = useAuth()
  const content = getPageContent(page)
  const user = auth.user || { name: 'PBX learner', email: '' }
  const currentPlan = getUserPlan(user)

  return (
    <DrawerShell
      account={(
        <AccountPanel
          onLogout={auth.logout}
        />
      )}
      accountIdentity={(
        <AccountIdentity
          badge={{ className: getPlanBadgeClass(currentPlan), label: currentPlan === 'plus' ? 'Plus' : 'Free' }}
          caption="Nursing learner"
          name={user.name}
        />
      )}
      brand={brand}
      drawerId="home-drawer"
      navGroups={navGroups}
      title={content.title}
    >
      <PageBody currentPlan={currentPlan} page={page} />
    </DrawerShell>
  )
}

export default HomePage
