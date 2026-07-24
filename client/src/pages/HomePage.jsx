import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { brand, pricing } from '../content/landing/index.js'
import {
  createTest,
  deleteHighlight,
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
import { NotebookViewer } from '../features/test/components/NotesModal.jsx'

const navGroups = [{
  label: 'Menu',
  items: [
    { label: 'Dashboard', href: '/home', icon: 'dashboard', end: true },
    { label: 'Performance', href: '/performance', icon: 'analytics' },
    { label: 'Create Test', href: '/tests/create', icon: 'add_circle' },
    { label: 'Previous Tests', href: '/tests', icon: 'description', end: true },
    { label: 'Notes', href: '/notes', icon: 'format_list_bulleted' },
    { label: 'Feedback', href: '/feedback', icon: 'chat_bubble_outline' },
  ],
}]

const pageContent = {
  dashboard: { eyebrow: 'Dashboard', title: '' },
  performance: { eyebrow: 'Performance', title: 'Performance' },
  profile: { eyebrow: 'Profile', title: '' },
  createTest: { eyebrow: 'Tests', title: 'Create Test' },
  tests: { eyebrow: 'Tests', title: '' },
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

function PerformanceOverview({ rows, total }) {
  const radii = [92, 79, 66, 53, 40, 27]

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 px-6 py-8 md:px-10 md:py-9" aria-label="Performance overview">
      <div className="grid items-center gap-8 lg:grid-cols-[340px_400px] lg:gap-10">
        <svg className="mx-auto size-64 overflow-visible md:size-72" role="img" viewBox="0 0 220 220" aria-label="Question performance rings">
          <g transform="rotate(-90 110 110)">
            {rows.map((row, index) => (
              <circle
                className={`circular-progress-trace ${row.color}`}
                cx="110"
                cy="110"
                fill="none"
                key={row.label}
                pathLength="100"
                r={radii[index]}
                stroke="currentColor"
                strokeDasharray="100"
                strokeLinecap="round"
                strokeWidth="7"
                style={{ '--progress-offset': 100 - row.percent, '--trace-delay': `${index * 90}ms` }}
              />
            ))}
          </g>
        </svg>

        <div className="w-full max-w-[400px]">
          <h2 className="mb-5 text-lg font-bold text-base-content">Performance Overview</h2>
          <dl className="grid gap-4">
            {rows.map((row) => (
              <div className="flex items-center justify-between gap-8" key={row.label}>
                <dt className="text-sm text-base-content/80">{row.label}</dt>
                <dd className={`min-w-16 rounded-full px-3 py-1 text-center text-xs font-bold text-white shadow-sm ${row.badge}`}>{row.percent}%</dd>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between gap-8 border-t border-base-300 pt-4">
              <dt className="text-sm font-bold text-base-content">Total Questions</dt>
              <dd className="min-w-16 rounded-full bg-neutral px-3 py-1 text-center text-xs font-bold text-neutral-content shadow-sm">{total}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

function PerformancePageContent() {
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
  const used = asCount(data.usedQuestions ?? data.attemptedQuestions)
  const correct = asCount(data.correctQuestions)
  const incorrect = asCount(data.incorrectQuestions)
  const partiallyIncorrect = asCount(data.partiallyIncorrectQuestions)
  const omitted = asCount(data.omittedQuestions ?? Math.max(used - correct - incorrect, 0))
  const percent = (value, denominator) => denominator > 0 ? Math.round((value / denominator) * 100) : 0
  const overviewRows = [
    { label: 'Unused Questions', percent: percent(Math.max(total - used, 0), total), color: 'text-base-content/45', badge: 'bg-base-content/45' },
    { label: 'Correct', percent: percent(correct, total), color: 'text-success', badge: 'bg-success' },
    { label: 'Incorrect', percent: percent(incorrect, total), color: 'text-error', badge: 'bg-error' },
    { label: 'Partially Incorrect', percent: percent(partiallyIncorrect, total), color: 'text-warning', badge: 'bg-warning' },
    { label: 'Omitted', percent: percent(omitted, total), color: 'text-neutral/75', badge: 'bg-neutral/75' },
    { label: 'Used Questions', percent: percent(used, total), color: 'text-info', badge: 'bg-info' },
  ]

  return (
    <div className="grid gap-10">
      <PerformanceOverview rows={overviewRows} total={total} />

      <StatTable subjects={data.subjects} systems={data.systems} />
    </div>
  )
}

function DashboardPageContent({ user }) {
  const name = user?.name || 'PBX learner'
  const tiles = [
    { href: '/performance', icon: 'analytics', title: 'Performance', copy: "See if you're ready to pass" },
    { href: '/tests/create', icon: 'add_box', title: 'Create Test', copy: 'Study up to 85 questions at a time' },
    { href: '/tests', icon: 'history', title: 'Previous Tests', copy: 'Review past test attempts' },
    { href: '/notes', icon: 'description', title: 'Notebook', copy: 'See your custom Notes' },
    { href: '/highlights', icon: 'ink_highlighter', title: 'Highlights', copy: 'Review your saved question highlights' },
    { href: '/feedback', icon: 'chat_bubble_outline', title: 'Feedback', copy: 'View your question feedback threads' },
    { href: '/pricing', icon: 'workspace_premium', title: 'Pricing', copy: 'Compare plans and membership benefits' },
    { href: '/payment', icon: 'payments', title: 'Payment', copy: 'Upgrade or manage your subscription payment' },
  ]

  return (
    <div className="grid gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-base-content md:text-3xl">Good Morning, {name}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 py-1 pl-4 pr-1 text-sm font-semibold">
            <span>22 days left</span>
            <Link className="btn btn-secondary btn-sm rounded-full px-4" to="/pricing">Upgrade</Link>
          </div>
          <Link className="avatar avatar-placeholder" to="/profile"><div className="w-9 rounded-full bg-secondary/15 text-secondary"><span className="font-bold">{name[0]}</span></div></Link>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-base-content/25 hover:shadow-md" to={tile.href} key={tile.title}>
            <div className="card-body min-h-28 flex-row items-start gap-4 p-6">
              <div className="grid size-11 shrink-0 place-items-center rounded-box bg-base-200 text-primary"><span className="material-symbols-outlined">{tile.icon}</span></div>
              <div className="min-w-0 flex-1"><h2 className="font-bold text-base-content">{tile.title}</h2><p className="mt-1 text-sm text-base-content/65">{tile.copy}</p></div>
              <span className="text-xl text-base-content/45">›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatTable({ subjects = [], systems = [] }) {
  const [activeTab, setActiveTab] = useState('subjects')
  const rows = activeTab === 'subjects' ? subjects : systems

  return (
    <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-6 md:p-8">
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
                  <progress className="progress progress-success mt-2 block h-1.5 w-full" max={row.totalQuestions || 1} value={row.usedQuestions ?? row.attemptedQuestions} />
                </td>
                <td>{row.usedQuestions ?? row.attemptedQuestions}/{row.totalQuestions}</td>
                <td>{row.correctQuestions} / {row.totalQuestions} ({getPercent(row.correctQuestions, row.totalQuestions)})</td>
                <td>{row.correctQuestions} ({getPercent(row.correctQuestions, row.totalQuestions)})</td>
                <td>{row.incorrectQuestions} ({getPercent(row.incorrectQuestions, row.totalQuestions)})</td>
                <td>{row.omittedQuestions ?? 0} ({getPercent(row.omittedQuestions ?? 0, row.totalQuestions)})</td>
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
  const [state, setState] = useState({ loading: true, error: '', notes: [] })
  const [openNotebook, setOpenNotebook] = useState(null)

  useEffect(() => {
    listNotes()
      .then((payload) => setState({ loading: false, error: '', notes: payload.notes || [] }))
      .catch((error) => setState({ loading: false, error: error.message, notes: [] }))
  }, [])

  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} />

  const notebooks = Array.from(state.notes.reduce((groups, note) => {
    const key = note.testId || 'unassigned'
    const current = groups.get(key) || { testId: note.testId, notes: [], updatedAt: note.updatedAt }
    current.notes.push(note)
    if (new Date(note.updatedAt) > new Date(current.updatedAt)) current.updatedAt = note.updatedAt
    groups.set(key, current)
    return groups
  }, new Map()).values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  return (
    <>
      <section className="rounded-2xl border border-base-300 bg-base-100 p-6 md:p-8">
        <table className="table">
          <thead><tr><th className="w-28">Serial No.</th><th>Test ID</th><th>Notes</th><th>Updated</th><th /></tr></thead>
          <tbody>
            {notebooks.map((notebook, index) => (
              <tr key={notebook.testId || 'unassigned'}>
                <td className="font-bold">{index + 1}</td>
                <td className="font-mono">{notebook.testId || 'Legacy notes'}</td>
                <td>{notebook.notes.length}</td>
                <td>{new Date(notebook.updatedAt).toLocaleString()}</td>
                <td className="text-right"><button className="btn btn-primary" type="button" onClick={() => setOpenNotebook(notebook)}>Open Notebook</button></td>
              </tr>
            ))}
            {notebooks.length === 0 ? <tr><td className="py-10 text-center text-base-content/60" colSpan="5">No test notebooks yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
      {openNotebook ? <NotebookViewer notes={openNotebook.notes} onClose={() => setOpenNotebook(null)} /> : null}
    </>
  )
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
    <div className="grid gap-10">
      <div>
        <h1 className="text-3xl font-semibold text-base-content">Previous Tests</h1>
        <div className="mt-2 border-b border-base-300" />
      </div>
      <TestsTable
        emptyMessage="No incomplete tests."
        tests={incomplete}
        title="Continue Tests"
        variant="continue"
      />
      <TestsTable
        emptyMessage="No completed tests yet."
        tests={completed}
        title="Completed Tests"
        variant="completed"
      />
    </div>
  )
}

function TestScoreRing({ value }) {
  const percentage = Math.min(100, Math.max(0, asCount(value)))

  return (
    <div className="relative size-[58px]">
      <svg className="size-full -rotate-90 drop-shadow-sm" role="img" viewBox="0 0 58 58" aria-label={`${percentage}% scored`}>
        <circle className="text-base-200" cx="29" cy="29" fill="none" r="25" stroke="currentColor" strokeWidth="6" />
        <circle
          className="circular-progress-trace text-success"
          cx="29"
          cy="29"
          fill="none"
          pathLength="100"
          r="25"
          stroke="currentColor"
          strokeDasharray="100"
          strokeLinecap="round"
          strokeWidth="6"
          style={{ '--progress-offset': 100 - percentage }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold text-base-content">{percentage}%</span>
    </div>
  )
}

function TestsTable({ emptyMessage, tests, title, variant }) {
  const isCompleted = variant === 'completed'

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-6 md:p-8">
      <h2 className="mb-6 text-xl font-bold text-base-content">{title}</h2>
      <div className="overflow-x-auto">
        <table className="table min-w-[1050px]">
          <thead>
            <tr className="border-base-300 text-xs uppercase text-base-content/75">
              <th>% Scored</th>
              <th>Questions</th>
              <th>Scored / Max</th>
              <th>Created On</th>
              <th>Mode</th>
              <th>Test ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => {
              const correct = asCount(test.scoreSummary?.correct)
              const max = asCount(test.questionCount)
              const score = asCount(test.scoreSummary?.percentage ?? (max > 0 ? Math.round((correct / max) * 100) : 0))

              return (
              <tr className="border-base-300 text-sm text-base-content" key={test.id}>
                <td className="py-5"><TestScoreRing value={score} /></td>
                <td>{test.questionCount}</td>
                <td>{correct}/{max}</td>
                <td>{new Date(test.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>{test.tutorMode ? 'Tutored' : 'Untutored'}, {test.timed ? 'timed' : 'untimed'}</td>
                <td className="max-w-52 truncate" title={test.id}>{test.id}</td>
                <td className="text-right">
                  {isCompleted ? (
                    <div className="flex justify-end gap-3">
                      <Link className="btn btn-primary h-[42px] w-[130px]" to={`/tests/${test.id}/result`}>Result</Link>
                      <Link className="btn btn-primary h-[42px] w-[130px]" to={`/tests/${test.id}/review`}>Review</Link>
                    </div>
                  ) : (
                    <Link className="btn btn-primary h-[42px] w-[130px]" to={`/tests/${test.id}`}>Continue</Link>
                  )}
                </td>
              </tr>
              )
            })}
            {tests.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-base-content/60" colSpan="7">{emptyMessage}</td>
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
            <Link className="btn btn-primary" to={href}>{plan.key === 'plus' ? 'Buy Plus' : 'Use Free'}</Link>
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

function ProfilePageContent({ currentPlan, onLogout, user }) {
  const navigate = useNavigate()
  const initial = user.name?.[0]?.toUpperCase() || 'U'
  const profileRows = [
    { icon: 'badge', label: 'Name', value: user.name },
    { icon: 'mail', label: 'Email', value: user.email },
    { icon: 'call', label: 'Contact', value: user.phone || 'Not provided' },
  ]
  const logout = async () => {
    await onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="grid gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-100 px-6 py-6 md:px-8">
        <div className="flex items-center gap-4">
          <div className="avatar avatar-placeholder"><div className="w-12 rounded-full bg-secondary/15 text-secondary"><span className="font-bold">{initial}</span></div></div>
          <div><h1 className="text-xl font-bold">Good Morning, {user.name}</h1><p className="text-sm text-base-content/60">Manage your account and membership details</p></div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-error h-[42px]" type="button" onClick={logout}><span className="material-symbols-outlined">logout</span>Log out</button>
          <Link className="btn btn-primary h-[42px] w-[130px]" to="/home">Dashboard</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 px-6 py-6 md:px-8">
        <div className="mb-5 flex items-start gap-3 text-primary"><span className="material-symbols-outlined">person</span><div><h2 className="font-bold text-base-content">Profile</h2><p className="text-sm text-base-content/60">Personal details</p></div></div>
        {profileRows.map((row) => (
          <div className="flex min-h-[70px] flex-wrap items-center justify-between gap-4 border-b border-base-200 last:border-0" key={row.label}>
            <div className="flex items-center gap-4 text-base-content/80"><span className="material-symbols-outlined text-base-content/55">{row.icon}</span><span>{row.label}</span></div>
            <strong className="text-sm">{row.value}</strong>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 px-6 py-6 md:px-8">
        <div className="mb-5 flex items-start gap-3 text-primary"><span className="material-symbols-outlined">card_membership</span><div><h2 className="font-bold text-base-content">Membership</h2><p className="text-sm text-base-content/60">View and manage your membership plan</p></div></div>
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-base-200 p-5">
          <div><div className="flex items-center gap-3"><strong>Plan - {currentPlan === 'plus' ? 'Plus' : 'Free'}</strong><span className="badge badge-success badge-sm">Active</span></div><p className="mt-1 text-sm text-base-content/60">Your current PBX Nursing membership</p></div>
          <div className="flex flex-wrap items-center gap-8"><div className="text-right"><p className="text-xs font-bold uppercase text-base-content/60">Payment history</p><p className="text-sm text-base-content/80">View your subscription and billing options</p></div><Link className="btn btn-primary h-[42px] w-[140px]" to="/pricing">{currentPlan === 'plus' ? 'Renew Plan' : 'Upgrade'}</Link></div>
        </div>
      </section>

    </div>
  )
}

function PageBody({ page, currentPlan, onLogout, user }) {
  if (page === 'dashboard') return <DashboardPageContent user={user} />
  if (page === 'performance') return <PerformancePageContent />
  if (page === 'createTest') return <CreateTestPageContent />
  if (page === 'tests') return <TestsPageContent />
  if (page === 'feedback') return <FeedbackPageContent />
  if (page === 'highlights') return <HighlightsPageContent />
  if (page === 'notes') return <NotesPageContent />
  if (page === 'pricing') return <PricingPageContent currentPlan={currentPlan} />
  if (page === 'payment') return <PaymentPageContent />
  if (page === 'profile') return <ProfilePageContent currentPlan={currentPlan} onLogout={onLogout} user={user} />

  return <DashboardPageContent user={user} />
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
          name={user.name}
        />
      )}
      accountIdentity={(
        <AccountIdentity
          badge={{ className: getPlanBadgeClass(currentPlan), label: currentPlan === 'plus' ? 'Plus' : 'Free' }}
          caption="Nursing learner"
          name={user.name}
          to="/profile"
        />
      )}
      brand={brand}
      drawerId="home-drawer"
      navGroups={navGroups}
      title={content.title}
      user={user}
    >
      <PageBody currentPlan={currentPlan} onLogout={auth.logout} page={page} user={user} />
    </DrawerShell>
  )
}

export default HomePage
