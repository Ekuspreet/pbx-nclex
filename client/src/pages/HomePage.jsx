import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { brand } from '../content/landing/index.js'
import {
  activateFreeMonth,
  createHighlight,
  createNote,
  createTest,
  deleteHighlight,
  getDashboard,
  getFeedback,
  getPaymentHistory,
  getPlans,
  getReferralSummary,
  listFeedback,
  listHighlights,
  listNotes,
  listTests,
  previewDiscountCode,
  replyFeedback,
} from '../services/studyAdapter.js'
import DrawerShell, { AccountIdentity, AccountPanel } from '../ui/layout/DrawerShell.jsx'
import QuestionReviewModal from '../ui/questionnaire/QuestionReviewModal.jsx'
import { NotebookViewer } from '../features/test/components/NotesModal.jsx'
import Modal from '../features/test/components/Modal.jsx'
import { apiRequest, getApiErrorMessage } from '../services/apiClient.js'
import { usePlanCatalog } from '../hooks/usePlanCatalog.js'
import { queryKeys } from '../services/queryKeys.js'

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

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function useTimeGreeting() {
  const [greeting, setGreeting] = useState(() => getTimeGreeting())

  useEffect(() => {
    const timer = window.setInterval(() => setGreeting(getTimeGreeting()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return greeting
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

function getMembershipLabel(user) {
  if (getUserPlan(user) !== 'plus' || !user?.subscriptionExpiresAt) return 'Free plan'
  const remainingMs = new Date(user.subscriptionExpiresAt).getTime() - Date.now()
  const days = Math.max(0, Math.ceil(remainingMs / 86_400_000))
  return days === 1 ? '1 day left' : `${days} days left`
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

const PERFORMANCE_ANIMATION_DURATION = 1400
const PERFORMANCE_RING_DELAY = 90

function easePerformanceProgress(progress) {
  // Mirrors cubic-bezier(0.22, 1, 0.36, 1) used by the progress rings.
  const x1 = 0.22
  const y1 = 1
  const x2 = 0.36
  const y2 = 1
  let position = progress

  for (let index = 0; index < 5; index += 1) {
    const inverse = 1 - position
    const x = (3 * inverse * inverse * position * x1) + (3 * inverse * position * position * x2) + (position ** 3)
    const slope = (3 * inverse * inverse * x1) + (6 * inverse * position * (x2 - x1)) + (3 * position * position * (1 - x2))
    if (Math.abs(slope) < 0.0001) break
    position -= (x - progress) / slope
  }

  const inverse = 1 - position
  return (3 * inverse * inverse * position * y1) + (3 * inverse * position * position * y2) + (position ** 3)
}

function AnimatedNumber({ value, delay = 0 }) {
  const numericValue = Number.parseFloat(value)
  const target = Math.round(Number.isFinite(numericValue) ? numericValue : 0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(target)
      return undefined
    }

    let animationFrame
    const startedAt = window.performance.now() + delay

    const update = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / PERFORMANCE_ANIMATION_DURATION))
      setDisplayValue(Math.round(target * easePerformanceProgress(progress)))
      if (progress < 1) animationFrame = window.requestAnimationFrame(update)
    }

    animationFrame = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [delay, target])

  return displayValue
}

function PerformanceOverview({ rows, total }) {
  const radii = [92, 79, 66, 53, 40, 27]
  const ringRows = [
    ...rows.filter((row) => row.label !== 'Partially Incorrect'),
    ...rows.filter((row) => row.label === 'Partially Incorrect'),
  ]

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 px-4 py-8 sm:px-6 md:px-10 md:py-9" aria-label="Performance overview">
      <div className="grid items-center gap-8 lg:grid-cols-[340px_400px] lg:gap-10">
        <svg className="mx-auto size-52 overflow-visible sm:size-64 md:size-72" role="img" viewBox="0 0 220 220" aria-label="Question performance rings">
          <g transform="rotate(-90 110 110)">
            {ringRows.map((row, index) => (
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
            {rows.map((row) => {
              const ringIndex = ringRows.findIndex((ringRow) => ringRow.label === row.label)
              return (
              <div className="flex items-center justify-between gap-8" key={row.label}>
                <dt className="text-sm text-base-content/80">{row.label}</dt>
                <dd className={`min-w-16 rounded-full px-3 py-1 text-center text-xs font-bold text-white shadow-sm ${row.badge}`}><AnimatedNumber delay={ringIndex * PERFORMANCE_RING_DELAY} value={row.percent} />%</dd>
              </div>
              )
            })}
            <div className="mt-1 flex items-center justify-between gap-8 border-t border-base-300 pt-4">
              <dt className="text-sm font-bold text-base-content">Total Questions</dt>
              <dd className="min-w-16 rounded-full bg-neutral px-3 py-1 text-center text-xs font-bold text-neutral-content shadow-sm"><AnimatedNumber value={total} /></dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

function PerformancePageContent() {
  const dashboardQuery = useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard })
  if (dashboardQuery.isPending) return <LoadingState />
  if (dashboardQuery.isError) return <ErrorState message={dashboardQuery.error.message} />
  const data = dashboardQuery.data
  const total = asCount(data.totalQuestions)
  const used = asCount(data.usedQuestions)
  const attempted = asCount(data.attemptedQuestions)
  const correct = asCount(data.correctQuestions)
  const incorrect = asCount(data.incorrectQuestions)
  const partiallyIncorrect = asCount(data.partiallyIncorrectQuestions)
  const omitted = asCount(data.omittedQuestions)
  const presented = asCount(data.presentedQuestions ?? attempted + omitted)
  const percent = (value, denominator) => denominator > 0 ? Math.round((value / denominator) * 100) : 0
  const overviewRows = [
    { label: 'Unused Questions', percent: percent(Math.max(total - used, 0), total), color: 'text-base-content/45', badge: 'bg-base-content/45' },
    { label: 'Correct', percent: percent(correct, attempted), color: 'text-success', badge: 'bg-success' },
    { label: 'Incorrect', percent: percent(incorrect, attempted), color: 'text-error', badge: 'bg-error' },
    { label: 'Partially Incorrect', percent: percent(partiallyIncorrect, attempted), color: 'text-warning', badge: 'bg-warning' },
    { label: 'Omitted', percent: percent(omitted, presented), color: 'text-neutral/75', badge: 'bg-neutral/75' },
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
  const greeting = useTimeGreeting()
  const currentPlan = getUserPlan(user)
  const membershipLabel = getMembershipLabel(user)
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
        <h1 className="text-2xl font-semibold text-base-content md:text-3xl">{greeting}, {name}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 py-1 pl-4 pr-1 text-sm font-semibold">
            <span>{membershipLabel}</span>
            <Link className="btn btn-secondary btn-sm rounded-full px-4" to="/pricing">{currentPlan === 'plus' ? 'Renew' : 'Upgrade'}</Link>
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

function OutcomeProgressBar({ correct, incorrect, omitted, total }) {
  const totalQuestions = Math.max(0, asCount(total))
  const outcomes = [
    { label: 'correct', count: Math.max(0, asCount(correct)), className: 'bg-success' },
    { label: 'incorrect', count: Math.max(0, asCount(incorrect)), className: 'bg-error' },
    { label: 'omitted', count: Math.max(0, asCount(omitted)), className: 'bg-neutral/75' },
  ]
  const completed = outcomes.reduce((sum, outcome) => sum + outcome.count, 0)
  const completedPercent = totalQuestions > 0 ? Math.min(100, (completed / totalQuestions) * 100) : 0

  return (
    <div
      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-base-300 shadow-inner"
      role="img"
      aria-label={`${outcomes[0].count} correct, ${outcomes[1].count} incorrect, ${outcomes[2].count} omitted out of ${totalQuestions} questions`}
    >
      <div className="taxonomy-progress-fill flex h-full origin-left overflow-hidden rounded-full" style={{ width: `${completedPercent}%` }}>
        {outcomes.map((outcome) => (
          <span
            className={`h-full ${outcome.className}`}
            key={outcome.label}
            style={{ width: completed > 0 ? `${(outcome.count / completed) * 100}%` : '0%' }}
          />
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
            {rows.map((row) => {
              const attempted = asCount(row.attemptedQuestions)
              const omitted = asCount(row.omittedQuestions)
              const presented = asCount(row.presentedQuestions ?? attempted + omitted)
              const used = asCount(row.usedQuestions)

              return (
                <tr key={`${activeTab}:${row.key}`}>
                  <td className="min-w-64">
                    <span>{row.label}</span>
                    <OutcomeProgressBar
                      correct={row.correctQuestions}
                      incorrect={row.incorrectQuestions}
                      omitted={omitted}
                      total={row.totalQuestions}
                    />
                  </td>
                  <td><AnimatedNumber value={used} />/<AnimatedNumber value={row.totalQuestions} /></td>
                  <td><AnimatedNumber value={row.correctQuestions} /> / <AnimatedNumber value={attempted} /> (<AnimatedNumber value={getPercent(row.correctQuestions, attempted)} />%)</td>
                  <td><AnimatedNumber value={row.correctQuestions} /> (<AnimatedNumber value={getPercent(row.correctQuestions, attempted)} />%)</td>
                  <td><AnimatedNumber value={row.incorrectQuestions} /> (<AnimatedNumber value={getPercent(row.incorrectQuestions, attempted)} />%)</td>
                  <td><AnimatedNumber value={omitted} /> (<AnimatedNumber value={getPercent(omitted, presented)} />%)</td>
                </tr>
              )
            })}
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
  const queryClient = useQueryClient()
  const statsQuery = useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard })
  const createTestMutation = useMutation({ mutationFn: createTest })
  const filtersInitialized = useRef(false)
  const [form, setForm] = useState({
    tutorMode: true,
    timed: false,
    questionCount: 10,
    questionMode: 'unused',
    subjects: [],
    systems: [],
  })
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!statsQuery.data || filtersInitialized.current) return
    filtersInitialized.current = true
    setForm((current) => ({
      ...current,
      subjects: (statsQuery.data.subjects || []).map((option) => option.key),
      systems: (statsQuery.data.systems || []).map((option) => option.key),
    }))
  }, [statsQuery.data])

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
    setSubmitError('')

    try {
      const payload = await createTestMutation.mutateAsync({
        ...form,
        questionCount: Number(form.questionCount),
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tests })
      navigate(`/tests/${payload.test.id}`)
    } catch (error) {
      setSubmitError(error.message)
    } finally { /* mutation tracks pending state */ }
  }

  if (statsQuery.isPending) return <LoadingState />
  if (statsQuery.isError) return <ErrorState message={statsQuery.error.message} />

  const filterStats = statsQuery.data.filterStats || []
  const matchesMode = (row, mode = form.questionMode) => row.modes?.includes(mode)
  const matchesSubjects = (row) => form.subjects.includes(row.subject)
  const matchesSystems = (row) => form.systems.includes(row.system)
  const matchesSelectedSubjectsForCount = (row) => form.subjects.length === 0 || matchesSubjects(row)
  const matchesSelectedSystemsForCount = (row) => form.systems.length === 0 || matchesSystems(row)
  const getSubjectCount = (option) => filterStats.filter((row) => row.subject === option.key && matchesSelectedSystemsForCount(row) && matchesMode(row)).length
  const getSystemCount = (option) => filterStats.filter((row) => row.system === option.key && matchesSelectedSubjectsForCount(row) && matchesMode(row)).length
  const modeCounts = {
    unused: filterStats.filter((row) => matchesMode(row, 'unused') && matchesSubjects(row) && matchesSystems(row)).length,
    incorrect: filterStats.filter((row) => matchesMode(row, 'incorrect') && matchesSubjects(row) && matchesSystems(row)).length,
    marked: filterStats.filter((row) => matchesMode(row, 'marked') && matchesSubjects(row) && matchesSystems(row)).length,
    omitted: filterStats.filter((row) => matchesMode(row, 'omitted') && matchesSubjects(row) && matchesSystems(row)).length,
    correct: filterStats.filter((row) => matchesMode(row, 'correct') && matchesSubjects(row) && matchesSystems(row)).length,
  }
  const matchingQuestionCount = filterStats.filter((row) => matchesMode(row) && matchesSubjects(row) && matchesSystems(row)).length
  const maxQuestions = Math.min(matchingQuestionCount, 85)

  return (
    <form className="grid gap-8" onSubmit={submit}>
      {submitError ? <ErrorState message={submitError} /> : null}

      <fieldset>
        <legend className="text-h6 mb-4">Test Mode</legend>
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.tutorMode} onChange={(event) => setForm({ ...form, tutorMode: event.target.checked })} />
            <span className="label-text text-black">Tutor</span>
          </label>
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.timed} onChange={(event) => setForm({ ...form, timed: event.target.checked })} />
            <span className="label-text text-black">Timed</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-h6 mb-4 flex items-center gap-2">
          Question Mode
          <span className="tooltip tooltip-right" data-tip="Choose one question history mode. Counts update with the selected subjects and systems.">
            <span className="material-symbols-outlined text-info" aria-label="About question modes">info</span>
          </span>
        </legend>
        <div className="flex flex-wrap gap-x-10 gap-y-3" role="radiogroup" aria-label="Question mode">
          {[
            ['unused', 'Unused'],
            ['incorrect', 'Incorrect'],
            ['marked', 'Marked'],
            ['omitted', 'Omitted'],
            ['correct', 'Correct'],
          ].map(([value, label]) => (
            <QuestionModeOption
              count={modeCounts[value]}
              key={value}
              label={label}
              selected={form.questionMode === value}
              value={value}
              onChange={() => setForm((current) => ({
                ...current,
                questionMode: value,
                questionCount: Math.min(Math.max(modeCounts[value], 1), asCount(current.questionCount), 85),
              }))}
            />
          ))}
        </div>
      </fieldset>

      <FilterPicker
        label="Subjects"
        options={statsQuery.data.subjects}
        getCount={getSubjectCount}
        selected={form.subjects}
        onSelectAll={(selectAll) => setForm((current) => ({ ...current, subjects: selectAll ? statsQuery.data.subjects.map((option) => option.key) : [] }))}
        onToggle={(key) => toggle('subjects', key)}
      />
      <FilterPicker
        label="Systems"
        options={statsQuery.data.systems}
        getCount={getSystemCount}
        selected={form.systems}
        onSelectAll={(selectAll) => setForm((current) => ({ ...current, systems: selectAll ? statsQuery.data.systems.map((option) => option.key) : [] }))}
        onToggle={(key) => toggle('systems', key)}
      />

      <footer className="surface-sticky mt-2 flex flex-col gap-5 border-0 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
        <label className="form-control !grid min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-[auto_5rem_auto] sm:gap-x-3">
          <span className="label-text whitespace-nowrap font-bold">No. of Questions</span>
          <input
            className="input input-bordered input-sm w-full text-center"
            max={maxQuestions}
            min="1"
            type="number"
            value={form.questionCount}
            onChange={(event) => setForm({ ...form, questionCount: event.target.value })}
          />
          <span className="flex items-baseline gap-1.5 text-caption text-muted sm:whitespace-nowrap">Max allowed <strong className="text-base-content">{maxQuestions}</strong></span>
        </label>
        <button className="btn btn-primary min-w-40" disabled={createTestMutation.isPending || maxQuestions === 0 || asCount(form.questionCount) > maxQuestions} type="submit">
          {createTestMutation.isPending ? <span className="loading loading-spinner loading-sm" /> : null}
          Generate Test
        </button>
      </footer>
    </form>
  )
}

function QuestionModeOption({ count, label, onChange, selected = false, value }) {
  const unavailable = count === 0

  return (
    <label className={`label justify-start gap-2 ${unavailable ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-black'}`}>
      <input className="radio radio-primary radio-sm" name="question-mode" checked={selected} disabled={unavailable} onChange={onChange} type="radio" value={value} />
      <span className={`label-text ${unavailable ? 'text-gray-400' : 'text-black'}`}>{label}</span>
      <span className={`badge badge-outline badge-sm ${unavailable ? 'border-gray-300 text-gray-400' : 'text-black'}`}>{count}</span>
    </label>
  )
}

function FilterPicker({ getCount = (option) => option.totalQuestions, label, options = [], selected = [], onSelectAll, onToggle }) {
  const allSelected = options.length > 0 && options.every((option) => selected.includes(option.key))

  return (
    <fieldset className="border-b border-base-300 pb-6 last:border-0">
      <legend className="text-h6 mb-3">Question {label}</legend>
      <label className="label mb-2 w-fit cursor-pointer justify-start gap-3">
        <input className="checkbox checkbox-primary checkbox-sm" checked={allSelected} onChange={() => onSelectAll(!allSelected)} type="checkbox" />
        <span className="label-text font-bold text-black">{label}</span>
        <span className="badge badge-ghost badge-sm">{allSelected ? 'All' : selected.length}</span>
      </label>
      <div className="grid gap-x-12 gap-y-1 pl-0 sm:pl-7 md:grid-cols-2">
        {options.map((option) => {
          const count = getCount(option)
          const unavailable = count === 0

          return (
          <label className={`label min-w-0 justify-start gap-3 py-2 ${unavailable ? 'cursor-not-allowed' : 'cursor-pointer'}`} key={option.key}>
            <input
              className="checkbox checkbox-primary checkbox-sm"
              checked={selected.includes(option.key)}
              disabled={unavailable}
              type="checkbox"
              onChange={() => onToggle(option.key)}
            />
            <span className={`label-text min-w-0 flex-1 truncate ${unavailable ? 'text-gray-400' : 'text-black'}`}>{option.label}</span>
            <span className={`badge badge-outline badge-sm ${unavailable ? 'border-gray-300 text-gray-400' : 'text-black'}`}>{count}</span>
          </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function NotesPageContent() {
  const queryClient = useQueryClient()
  const [openNotebook, setOpenNotebook] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [questionReference, setQuestionReference] = useState('')
  const notesQuery = useQuery({ queryKey: queryKeys.notes(), queryFn: ({ signal }) => listNotes({}, { signal }) })
  const highlightsQuery = useQuery({ queryKey: queryKeys.highlights(), queryFn: ({ signal }) => listHighlights({}, { signal }) })
  const createNoteMutation = useMutation({ mutationFn: createNote })
  const createHighlightMutation = useMutation({ mutationFn: createHighlight })
  const deleteHighlightMutation = useMutation({ mutationFn: deleteHighlight })
  if (notesQuery.isPending || highlightsQuery.isPending) return <LoadingState />
  if (notesQuery.isError || highlightsQuery.isError) return <ErrorState message={(notesQuery.error || highlightsQuery.error).message} />

  const notebooks = Array.from((notesQuery.data?.notes || []).reduce((groups, note) => {
    const key = note.testId || 'unassigned'
    const current = groups.get(key) || { testId: note.testId, notes: [], updatedAt: note.updatedAt }
    current.notes.push(note)
    if (new Date(note.updatedAt) > new Date(current.updatedAt)) current.updatedAt = note.updatedAt
    groups.set(key, current)
    return groups
  }, new Map()).values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  const saveNote = async (event) => {
    event.preventDefault()
    const content = noteDraft.trim()
    if (!content) return

    try {
      const reference = questionReference.trim()
      const payload = await createNoteMutation.mutateAsync({
        title: reference ? `QID ${reference}` : 'Standalone note',
        content,
        ...(reference ? { questionReference: Number(reference) } : {}),
      })
      queryClient.setQueryData(queryKeys.notes(), (current) => ({ ...current, notes: [payload.note, ...(current?.notes || [])] }))
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      setNoteDraft('')
      setQuestionReference('')
    } catch { /* surfaced by the mutation below */ }
  }

  const addNoteHighlight = async (note, selector) => {
    const payload = await createHighlightMutation.mutateAsync({ testId: note.testId, questionId: note.questionId, selector, color: 'yellow' })
    queryClient.setQueryData(queryKeys.highlights(), (current) => ({ ...current, highlights: [...(current?.highlights || []), payload.highlight] }))
    await queryClient.invalidateQueries({ queryKey: ['highlights'] })
  }

  const removeNoteHighlights = async (highlightIds) => {
    const ids = [...new Set(highlightIds)].filter(Boolean)
    await Promise.all(ids.map((highlightId) => deleteHighlightMutation.mutateAsync(highlightId)))
    queryClient.setQueryData(queryKeys.highlights(), (current) => ({ ...current, highlights: (current?.highlights || []).filter((highlight) => !ids.includes(highlight.id)) }))
    await queryClient.invalidateQueries({ queryKey: ['highlights'] })
  }

  return (
    <>
      <form className="mb-6 rounded-2xl border border-base-300 bg-base-100 p-6 md:p-8" onSubmit={saveNote}>
        <h2 className="text-xl font-bold">Add a note</h2>
        <p className="mt-1 text-sm text-base-content/60">The question ID is optional.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end">
          <label className="form-control">
            <span className="label-text mb-2 font-medium">Note</span>
            <textarea className="textarea textarea-bordered min-h-24" disabled={createNoteMutation.isPending} maxLength={20000} placeholder="Write a note…" required value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-medium">Question ID (optional)</span>
            <input className="input input-bordered w-full" disabled={createNoteMutation.isPending} inputMode="numeric" min="1" placeholder="e.g. 1234" step="1" type="number" value={questionReference} onChange={(event) => setQuestionReference(event.target.value)} />
          </label>
          <button className="btn btn-primary" disabled={createNoteMutation.isPending || !noteDraft.trim()} type="submit">{createNoteMutation.isPending ? <span className="loading loading-spinner loading-sm" /> : <span className="material-symbols-outlined">add</span>}Add note</button>
        </div>
        {createNoteMutation.isError ? <div className="alert alert-error mt-4"><span>{createNoteMutation.error.message}</span></div> : null}
      </form>
      <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-6 md:p-8">
        <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th className="w-28">Serial No.</th><th>Test ID</th><th>Notes</th><th>Updated</th><th /></tr></thead>
          <tbody>
            {notebooks.map((notebook, index) => (
              <tr key={notebook.testId || 'unassigned'}>
                <td className="font-bold">{index + 1}</td>
                <td className="font-mono">{notebook.testId || 'Standalone notes'}</td>
                <td>{notebook.notes.length}</td>
                <td>{new Date(notebook.updatedAt).toLocaleString()}</td>
                <td className="text-right"><button className="btn btn-primary" type="button" onClick={() => setOpenNotebook(notebook)}>Open Notebook</button></td>
              </tr>
            ))}
            {notebooks.length === 0 ? <tr><td className="py-10 text-center text-base-content/60" colSpan="5">No test notebooks yet.</td></tr> : null}
          </tbody>
        </table>
        </div>
      </section>
      {openNotebook ? <NotebookViewer highlights={highlightsQuery.data?.highlights || []} notes={openNotebook.notes} onAddHighlight={addNoteHighlight} onClose={() => setOpenNotebook(null)} onDeleteHighlight={removeNoteHighlights} /> : null}
    </>
  )
}

function HighlightsPageContent() {
  return <RecordsTable kind="highlights" loader={listHighlights} remover={deleteHighlight} />
}

function RecordsTable({ kind, loader, remover }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState(null)
  const key = kind === 'highlights' ? queryKeys.highlights() : queryKeys.notes()
  const recordsQuery = useQuery({ queryKey: key, queryFn: ({ signal }) => loader({}, { signal }) })
  const removeMutation = useMutation({ mutationFn: remover })

  const remove = async (id) => {
    await removeMutation.mutateAsync(id)
    await queryClient.invalidateQueries({ queryKey: key })
  }

  if (recordsQuery.isPending) return <LoadingState />
  if (recordsQuery.isError) return <ErrorState message={recordsQuery.error.message} />
  const rows = recordsQuery.data?.[kind] || []

  return (
    <section className="surface-raised min-w-0 rounded-lg border p-4">
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
            {rows.map((row) => (
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
                      onClick={() => {
                        if (kind === 'highlights') {
                          navigate(`/highlights/${row.id}/review`, { state: { highlight: row } })
                          return
                        }
                        setPreview({ question: row.question, highlights: [] })
                      }}
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan="4">No {kind} saved yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {preview ? <QuestionReviewModal initialHighlights={preview.highlights} question={preview.question} onClose={() => setPreview(null)} /> : null}
    </section>
  )
}

function FeedbackThreadModal({ onClose, onUpdated, threadId }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState('')
  const detailKey = queryKeys.feedbackDetail(threadId)
  const detailQuery = useQuery({ queryKey: detailKey, queryFn: ({ signal }) => getFeedback(threadId, { signal }) })
  const replyMutation = useMutation({ mutationFn: (message) => replyFeedback(threadId, message) })

  const submitReply = async (event) => {
    event.preventDefault()
    const message = reply.trim()
    if (!message) return

    try {
      const payload = await replyMutation.mutateAsync(message)
      queryClient.setQueryData(detailKey, payload)
      setReply('')
      if (payload.thread) onUpdated(payload.thread)
    } catch { /* surfaced by the mutation below */ }
  }

  const thread = detailQuery.data?.thread
  const messages = detailQuery.data?.messages || []
  const error = detailQuery.error || replyMutation.error

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
          {detailQuery.isPending ? <LoadingState /> : null}
          {error ? <ErrorState message={error.message} /> : null}
          {!detailQuery.isPending && !error ? (
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
            disabled={detailQuery.isPending || replyMutation.isPending || thread?.status === 'closed'}
            placeholder={thread?.status === 'closed' ? 'This thread is closed.' : 'Write a reply'}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Close</button>
            <button className="btn btn-primary" disabled={detailQuery.isPending || replyMutation.isPending || !reply.trim() || thread?.status === 'closed'} type="submit">
              {replyMutation.isPending ? <span className="loading loading-spinner loading-sm" /> : null}
              Send Reply
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FeedbackPageContent() {
  const queryClient = useQueryClient()
  const [previewQuestion, setPreviewQuestion] = useState(null)
  const [openThreadId, setOpenThreadId] = useState(null)
  const feedbackQuery = useQuery({ queryKey: queryKeys.feedback, queryFn: listFeedback })
  if (feedbackQuery.isPending) return <LoadingState />
  const rows = feedbackQuery.data?.feedback || []

  const updateThreadRow = (thread) => {
    queryClient.setQueryData(queryKeys.feedback, (current) => ({ ...current, feedback: (current?.feedback || []).map((row) => (row.id === thread.id ? { ...row, ...thread } : row)) }))
  }

  return (
    <div className="grid gap-6">
      <section className="surface-raised min-w-0 rounded-lg border p-4">
        <div className="mb-4">
          <h2 className="text-h3">Feedback Threads</h2>
          <p className="text-caption text-muted">Question feedback is submitted from the exam window.</p>
        </div>
        {feedbackQuery.isError ? <ErrorState message={feedbackQuery.error.message} /> : null}
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
              {rows.map((thread) => (
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
              {rows.length === 0 ? (
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
      {previewQuestion ? <QuestionReviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} /> : null}
    </div>
  )
}

function TestsPageContent() {
  const testsQuery = useQuery({ queryKey: queryKeys.tests, queryFn: listTests })
  if (testsQuery.isPending) return <LoadingState />
  if (testsQuery.isError) return <ErrorState message={testsQuery.error.message} />
  const tests = testsQuery.data?.tests || []
  const incomplete = tests.filter((test) => test.status !== 'completed')
  const completed = tests.filter((test) => test.status === 'completed')

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

function getTestPerformanceRows(scoreSummary, total) {
  const totalQuestions = Math.max(0, asCount(total))
  const correct = asCount(scoreSummary?.correct)
  const incorrect = asCount(scoreSummary?.incorrect)
  const omitted = asCount(scoreSummary?.unanswered)
  const percent = (value) => totalQuestions > 0 ? Math.round((value / totalQuestions) * 100) : 0
  return [
    { label: 'Correct', value: percent(correct), color: 'text-success', badge: 'bg-success' },
    { label: 'Incorrect', value: percent(incorrect), color: 'text-error', badge: 'bg-error' },
    { label: 'P. Incorrect', value: percent(asCount(scoreSummary?.partiallyIncorrect)), color: 'text-warning', badge: 'bg-warning' },
    { label: 'Omitted', value: percent(omitted), color: 'text-neutral/75', badge: 'bg-neutral/75' },
  ]
}

function TestPerformanceRings({ animated = false, className = 'size-[110px]', rows }) {
  const radii = [43, 34, 25, 16]

  return (
    <svg className={`${className} shrink-0 -rotate-90 overflow-visible`} aria-hidden="true" viewBox="0 0 100 100">
      {rows.map((row, index) => (
        <circle
          className={`${animated ? 'circular-progress-trace' : ''} ${row.color}`}
          cx="50"
          cy="50"
          fill="none"
          key={row.label}
          pathLength="100"
          r={radii[index]}
          stroke="currentColor"
          strokeDasharray="100"
          strokeDashoffset={animated ? undefined : 100 - row.value}
          strokeLinecap="round"
          strokeWidth="3.5"
          style={animated ? { '--progress-offset': 100 - row.value, '--trace-delay': `${index * PERFORMANCE_RING_DELAY}ms` } : undefined}
        />
      ))}
    </svg>
  )
}

function TestPerformanceTooltip({ position, scoreSummary, total }) {
  const rows = getTestPerformanceRows(scoreSummary, total)

  return (
    <div className="pointer-events-none fixed z-50 flex w-90 max-w-[calc(100vw-2rem)] items-center gap-6 rounded-3xl border border-base-300 bg-base-100/95 p-6 text-base-content shadow-2xl backdrop-blur-xl" data-theme="nord" style={position}>
      <TestPerformanceRings animated rows={rows} />
      <div className="min-w-0 flex-1">
        <h3 className="mb-2 text-sm font-bold text-base-content">Performance Overview</h3>
        <dl className="grid gap-1.5">
          {rows.map((row, index) => (
            <div className="flex items-center justify-between gap-3 text-xs text-base-content/70" key={row.label}>
              <dt>{row.label}</dt>
              <dd className={`min-w-8 rounded-full px-2 py-0.5 text-center text-[11px] font-bold text-white ${row.badge}`}><AnimatedNumber delay={index * PERFORMANCE_RING_DELAY} value={row.value} />%</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function TestScoreRing({ scoreSummary, total, value }) {
  const percentage = Math.min(100, Math.max(0, asCount(value)))
  const [animationKey, setAnimationKey] = useState(0)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState(null)
  const ringRef = useRef(null)

  const showDetails = () => {
    setAnimationKey((key) => key + 1)
    setTooltipOpen(true)
  }

  useEffect(() => {
    if (!tooltipOpen) return undefined

    const updatePosition = () => {
      const bounds = ringRef.current?.getBoundingClientRect()
      if (!bounds) return
      const width = Math.min(360, window.innerWidth - 32)
      const left = Math.min(Math.max(16, bounds.left), window.innerWidth - width - 16)
      const placeAbove = bounds.top >= 320
      setTooltipPosition({
        left,
        top: placeAbove ? bounds.top - 14 : bounds.bottom + 14,
        transform: placeAbove ? 'translateY(-100%)' : 'none',
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [tooltipOpen])

  return (
    <div
      className="group relative size-[58px] shrink-0 cursor-pointer overflow-visible outline-none"
      ref={ringRef}
      tabIndex="0"
      aria-label={`${percentage}% scored. Hover or focus for performance overview.`}
      onBlur={() => setTooltipOpen(false)}
      onFocus={showDetails}
      onMouseEnter={showDetails}
      onMouseLeave={() => setTooltipOpen(false)}
    >
      <div className="relative z-10 size-[58px] origin-center transition-transform duration-300 ease-out group-hover:scale-[1.6] group-focus-visible:scale-[1.6]">
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
        <span className="absolute inset-0 grid place-items-center text-xs font-bold text-base-content"><AnimatedNumber value={percentage} />%</span>
      </div>
      {tooltipOpen && tooltipPosition ? createPortal(
        <TestPerformanceTooltip key={animationKey} position={tooltipPosition} scoreSummary={scoreSummary} total={total} />,
        document.body,
      ) : null}
    </div>
  )
}

function TestsTable({ emptyMessage, tests, title, variant }) {
  const isCompleted = variant === 'completed'

  return (
    <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-6 md:p-8">
      <h2 className="mb-6 text-xl font-bold text-base-content">{title}</h2>
      <div className="grid gap-4 xl:hidden">
        {tests.map((test) => {
          const total = asCount(test.questionCount)
          const correct = asCount(test.scoreSummary?.correct)
          const outcomes = getTestPerformanceRows(test.scoreSummary, total)

          return (
            <article className="card min-w-0 border border-base-300 bg-base-100 shadow-sm" key={test.id}>
              <div className="card-body min-w-0 gap-4 p-4 sm:gap-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-base-content">{new Date(test.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="mt-1 break-all text-xs text-base-content/60" title={test.id}>{test.id}</p>
                  </div>
                  <TestPerformanceRings className="size-24" rows={outcomes} />
                </div>

                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {outcomes.map((outcome) => (
                    <div className="min-w-0 rounded-box bg-base-200 p-2.5 sm:p-3" key={outcome.label}>
                      <dt className="text-xs text-base-content/70">{outcome.label}</dt>
                      <dd className={`badge mt-2 ${outcome.badge}`}>{outcome.value}%</dd>
                    </div>
                  ))}
                </dl>

                <dl className="grid grid-cols-2 gap-4 border-y border-base-300 py-4 text-sm">
                  <div><dt className="text-base-content/60">Questions</dt><dd className="mt-1 font-bold">{total}</dd></div>
                  <div><dt className="text-base-content/60">Scored / Max</dt><dd className="mt-1 font-bold">{correct}/{total}</dd></div>
                  <div className="col-span-2"><dt className="text-base-content/60">Mode</dt><dd className="mt-1 font-bold">{test.tutorMode ? 'Tutored' : 'Untutored'}, {test.timed ? 'timed' : 'untimed'}</dd></div>
                </dl>

                <div className="card-actions grid grid-cols-2 gap-3">
                  {isCompleted ? (
                    <><Link className="btn btn-primary" to={`/tests/${test.id}/result`}>Result</Link><Link className="btn btn-primary" to={`/tests/${test.id}/review`}>Review</Link></>
                  ) : (
                    <Link className="btn btn-primary col-span-2" to={`/tests/${test.id}`}>Continue</Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}
        {tests.length === 0 ? <p className="py-8 text-center text-base-content/60">{emptyMessage}</p> : null}
      </div>

      <div className="hidden overflow-x-auto xl:block">
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
                <td className="py-5"><TestScoreRing scoreSummary={test.scoreSummary} total={max} value={score} /></td>
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

function PricingPageContent({ currentPlan, pricingContent }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pricingContent.plans.map((plan) => (
        <WorkspacePlanCard currentPlan={currentPlan} key={plan.key} plan={plan} />
      ))}
    </div>
  )
}

function PaymentPageContent({ onPaymentComplete, pricingContent }) {
  const plusPlan = pricingContent.plans.find((plan) => plan.key === 'plus')
  const [checkoutState, setCheckoutState] = useState({ status: 'idle', message: '' })
  const [codeInput, setCodeInput] = useState('')
  const [codePreview, setCodePreview] = useState(null)
  const [codeError, setCodeError] = useState('')
  const [useWalletCoins, setUseWalletCoins] = useState(false)
  const queryClient = useQueryClient()
  const plansQuery = useQuery({ queryKey: queryKeys.plans, queryFn: getPlans, staleTime: 5 * 60_000 })
  const referralSummaryQuery = useQuery({ queryKey: queryKeys.referralSummary, queryFn: getReferralSummary })
  const previewCodeMutation = useMutation({ mutationFn: previewDiscountCode })
  const createOrderMutation = useMutation({ mutationFn: (payload) => apiRequest('/payments/create-order', { method: 'POST', body: payload }) })
  const verifyPaymentMutation = useMutation({ mutationFn: (payment) => apiRequest('/payments/verify-payment', { method: 'POST', body: payment }) })

  const planAmount = plansQuery.data?.plans?.find((plan) => plan.key === 'plus')?.amount || 0
  const coinBalance = referralSummaryQuery.data?.coinBalance || 0
  const codeDiscount = codePreview?.discountAmount || 0
  const amountAfterCode = Math.max(0, planAmount - codeDiscount)
  const walletCoinsToRedeem = useWalletCoins ? Math.max(0, Math.min(coinBalance, Math.floor((amountAfterCode - 100) / 100))) : 0
  const finalAmount = Math.max(100, amountAfterCode - walletCoinsToRedeem * 100)
  const formatInr = (paise) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)

  const applyCode = async () => {
    setCodeError('')
    setCodePreview(null)
    const trimmed = codeInput.trim()
    if (!trimmed) return

    try {
      const preview = await previewCodeMutation.mutateAsync({ plan: 'plus', code: trimmed })
      setCodePreview(preview)
    } catch (error) {
      setCodeError(getApiErrorMessage(error))
    }
  }

  const startCheckout = async () => {
    if (!window.Razorpay) {
      setCheckoutState({ status: 'error', message: 'Payment checkout could not be loaded. Please refresh and try again.' })
      return
    }

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!key) {
      setCheckoutState({ status: 'error', message: 'Payment checkout is not configured.' })
      return
    }

    setCheckoutState({ status: 'loading', message: '' })

    try {
      const order = await createOrderMutation.mutateAsync({
        plan: 'plus',
        code: codePreview ? codeInput.trim() : undefined,
        redeemCoins: useWalletCoins,
      })

      const checkout = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'PBX Nursing',
        description: `${plusPlan.name} — ${plusPlan.cadence}`,
        order_id: order.order_id,
        handler: async (payment) => {
          setCheckoutState({ status: 'verifying', message: '' })

          try {
            await verifyPaymentMutation.mutateAsync(payment)
            await onPaymentComplete()
            await queryClient.invalidateQueries({ queryKey: queryKeys.payments })
            await queryClient.invalidateQueries({ queryKey: queryKeys.referralSummary })
            setCheckoutState({ status: 'success', message: 'Payment verified successfully. Your transaction is complete.' })
          } catch (error) {
            setCheckoutState({ status: 'error', message: getApiErrorMessage(error) })
          }
        },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            setCheckoutState((current) => ['success', 'verifying'].includes(current.status)
              ? current
              : { status: 'cancelled', message: 'Checkout was cancelled. No payment was completed.' })
          },
        },
      })

      checkout.on('payment.failed', (response) => {
        setCheckoutState({
          status: 'error',
          message: response.error?.description || 'Payment failed. Please try again.',
        })
      })
      checkout.open()
      setCheckoutState({ status: 'open', message: '' })
    } catch (error) {
      setCheckoutState({ status: 'error', message: getApiErrorMessage(error) })
    }
  }

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

          <label className="grid gap-1">
            <span className="label-text">Referral or promo code (optional)</span>
            <div className="flex gap-2">
              <input
                className="input input-bordered w-full uppercase"
                value={codeInput}
                onChange={(event) => { setCodeInput(event.target.value); setCodePreview(null); setCodeError('') }}
                placeholder="e.g. ABCD1234"
                disabled={checkoutState.status === 'loading' || checkoutState.status === 'verifying'}
              />
              <button className="btn btn-outline" type="button" onClick={applyCode} disabled={previewCodeMutation.isPending || !codeInput.trim()}>
                {previewCodeMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Apply'}
              </button>
            </div>
          </label>
          {codeError ? <p className="text-sm text-error">{codeError}</p> : null}
          {codePreview ? <p className="text-sm text-success">Code applied — {codePreview.discountPercent}% off ({formatInr(codePreview.discountAmount)})</p> : null}

          {coinBalance > 0 ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={useWalletCoins}
                onChange={(event) => setUseWalletCoins(event.target.checked)}
              />
              Use my {coinBalance} wallet coins for an extra discount
            </label>
          ) : null}

          {planAmount > 0 ? (
            <ul className="rule-list text-sm">
              <li className="flex justify-between"><span>Plan price</span><strong>{formatInr(planAmount)}</strong></li>
              {codeDiscount > 0 ? <li className="flex justify-between"><span>Code discount</span><strong>-{formatInr(codeDiscount)}</strong></li> : null}
              {walletCoinsToRedeem > 0 ? <li className="flex justify-between"><span>Wallet coins ({walletCoinsToRedeem})</span><strong>-{formatInr(walletCoinsToRedeem * 100)}</strong></li> : null}
              <li className="flex justify-between"><span>Payable</span><strong>{formatInr(finalAmount)}</strong></li>
            </ul>
          ) : null}

          <button
            className="btn btn-primary"
            disabled={checkoutState.status === 'loading' || checkoutState.status === 'verifying'}
            onClick={startCheckout}
            type="button"
          >
            {checkoutState.status === 'loading' ? 'Preparing checkout…' : checkoutState.status === 'verifying' ? 'Verifying payment…' : 'Buy Plus'}
          </button>
          {checkoutState.message ? (
            <div className={`alert ${checkoutState.status === 'success' ? 'alert-success' : checkoutState.status === 'cancelled' ? 'alert-warning' : 'alert-error'}`} role="status">
              <span>{checkoutState.message}</span>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  )
}

function ProfilePageContent({ currentPlan, onLogout, onSetPassword, onUpdateProfile, user }) {
  const navigate = useNavigate()
  const greeting = useTimeGreeting()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileStatus, setProfileStatus] = useState(null)
  const [profileValues, setProfileValues] = useState({ name: user.name || '', phone: user.phone || '' })
  const [passwordValues, setPasswordValues] = useState({ password: '', confirmPassword: '' })
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const paymentsQuery = useQuery({ queryKey: queryKeys.payments, queryFn: getPaymentHistory })
  const payments = paymentsQuery.data?.payments || []
  const queryClient = useQueryClient()
  const referralQuery = useQuery({ queryKey: queryKeys.referralSummary, queryFn: getReferralSummary })
  const [referralCopied, setReferralCopied] = useState(false)
  const [activateStatus, setActivateStatus] = useState(null)
  const activateFreeMonthMutation = useMutation({ mutationFn: activateFreeMonth })
  const copyReferralCode = async () => {
    const code = referralQuery.data?.code
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setReferralCopied(true)
      window.setTimeout(() => setReferralCopied(false), 2000)
    } catch {
      setReferralCopied(false)
    }
  }
  const activateOneFreeMonth = async () => {
    setActivateStatus(null)
    try {
      await activateFreeMonthMutation.mutateAsync()
      await queryClient.invalidateQueries({ queryKey: queryKeys.referralSummary })
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
      setActivateStatus({ type: 'success', message: 'A free month has been added to your membership.' })
    } catch (error) {
      setActivateStatus({ type: 'error', message: getApiErrorMessage(error) })
    }
  }
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
  const saveProfile = async (event) => {
    event.preventDefault()
    setProfileStatus(null)
    if (profileValues.name.trim().length < 2) {
      setProfileStatus({ type: 'error', message: 'Enter at least 2 characters for your name.' })
      return
    }

    setIsSaving(true)
    try {
      const result = await onUpdateProfile({ name: profileValues.name.trim(), phone: profileValues.phone.trim() })
      setProfileValues({ name: result.user.name, phone: result.user.phone || '' })
      setProfileStatus({ type: 'success', message: result.message })
      setIsEditing(false)
    } catch (error) {
      setProfileStatus({ type: 'error', message: getApiErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }
  const savePassword = async (event) => {
    event.preventDefault()
    setPasswordStatus(null)
    if (passwordValues.password.length < 8 || !/[A-Za-z]/.test(passwordValues.password) || !/\d/.test(passwordValues.password)) {
      setPasswordStatus({ type: 'error', message: 'Use at least 8 characters with a letter and number.' })
      return
    }
    if (passwordValues.password !== passwordValues.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords must match.' })
      return
    }

    setIsSavingPassword(true)
    try {
      const result = await onSetPassword(passwordValues)
      setPasswordValues({ password: '', confirmPassword: '' })
      setPasswordStatus({ type: 'success', message: result.message })
    } catch (error) {
      setPasswordStatus({ type: 'error', message: getApiErrorMessage(error) })
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="grid gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-100 px-6 py-6 md:px-8">
        <div className="flex items-center gap-4">
          <div className="avatar avatar-placeholder"><div className="w-12 rounded-full bg-secondary/15 text-secondary"><span className="font-bold">{initial}</span></div></div>
          <div><h1 className="text-xl font-bold">{greeting}, {user.name}</h1><p className="text-sm text-base-content/60">Manage your account and membership details</p></div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-error h-[42px]" type="button" onClick={logout}><span className="material-symbols-outlined">logout</span>Log out</button>
          <Link className="btn btn-primary h-[42px] w-[130px]" to="/home">Dashboard</Link>
        </div>
      </section>

      {!user.hasPassword ? (
        <section className="rounded-2xl border border-warning/50 bg-warning/10 px-6 py-6 md:px-8">
          <div className="mb-5 flex items-start gap-3"><span className="material-symbols-outlined text-warning">key</span><div><h2 className="font-bold">Set your password</h2><p className="text-sm text-base-content/70">Add a password once to enable standard email and password login. Until then, you can only sign in with Google.</p></div></div>
          {passwordStatus ? <div className={`alert mb-4 text-sm ${passwordStatus.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status"><span>{passwordStatus.message}</span></div> : null}
          <form className="grid max-w-xl gap-4" onSubmit={savePassword}>
            <label className="grid gap-1"><span className="label-text">Password</span><input className="input input-bordered w-full" type="password" autoComplete="new-password" value={passwordValues.password} onChange={(event) => setPasswordValues((current) => ({ ...current, password: event.target.value }))} disabled={isSavingPassword} required /></label>
            <label className="grid gap-1"><span className="label-text">Confirm password</span><input className="input input-bordered w-full" type="password" autoComplete="new-password" value={passwordValues.confirmPassword} onChange={(event) => setPasswordValues((current) => ({ ...current, confirmPassword: event.target.value }))} disabled={isSavingPassword} required /></label>
            <div><button className="btn btn-primary" type="submit" disabled={isSavingPassword}>{isSavingPassword ? <span className="loading loading-spinner loading-xs" /> : null}Set password</button></div>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border border-base-300 bg-base-100 px-6 py-6 md:px-8">
        <div className="mb-5 flex items-start justify-between gap-3 text-primary">
          <div className="flex items-start gap-3"><span className="material-symbols-outlined">person</span><div><h2 className="font-bold text-base-content">Profile</h2><p className="text-sm text-base-content/60">Personal details</p></div></div>
          <button className="btn btn-outline btn-sm" type="button" disabled={isSaving} onClick={() => { setIsEditing((value) => !value); setProfileStatus(null); setProfileValues({ name: user.name || '', phone: user.phone || '' }) }}>{isEditing ? 'Cancel' : 'Edit profile'}</button>
        </div>
        {profileStatus ? <div className={`alert mb-4 text-sm ${profileStatus.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status"><span>{profileStatus.message}</span></div> : null}
        {isEditing ? (
          <form className="grid gap-4" onSubmit={saveProfile}>
            <label className="grid gap-1"><span className="label-text">Name</span><input className="input input-bordered w-full" value={profileValues.name} maxLength={100} onChange={(event) => setProfileValues((current) => ({ ...current, name: event.target.value }))} disabled={isSaving} required /></label>
            <label className="grid gap-1"><span className="label-text">Contact number</span><input className="input input-bordered w-full" type="tel" inputMode="tel" value={profileValues.phone} maxLength={20} placeholder="e.g. +91 98765 43210" onChange={(event) => setProfileValues((current) => ({ ...current, phone: event.target.value }))} disabled={isSaving} /></label>
            <div><button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? <span className="loading loading-spinner loading-xs" /> : null}Save changes</button></div>
          </form>
        ) : profileRows.map((row) => (
          <div className="flex min-h-[70px] flex-wrap items-center justify-between gap-4 border-b border-base-200 last:border-0" key={row.label}>
            <div className="flex items-center gap-4 text-base-content/80"><span className="material-symbols-outlined text-base-content/55">{row.icon}</span><span>{row.label}</span></div>
            <strong className="text-sm">{row.value}</strong>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 px-6 py-6 md:px-8">
        <div className="mb-5 flex items-start gap-3 text-primary"><span className="material-symbols-outlined">card_membership</span><div><h2 className="font-bold text-base-content">Membership</h2><p className="text-sm text-base-content/60">View and manage your membership plan</p></div></div>
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-base-200 p-5">
          <div><div className="flex items-center gap-3"><strong>Plan - {currentPlan === 'plus' ? 'Plus' : 'Free'}</strong><span className={`badge badge-sm ${currentPlan === 'plus' ? 'badge-success' : 'badge-outline'}`}>{currentPlan === 'plus' ? 'Active' : 'Free'}</span></div><p className="mt-1 text-sm text-base-content/60">{getMembershipLabel(user)}{user.subscriptionExpiresAt ? ` · expires ${new Date(user.subscriptionExpiresAt).toLocaleDateString()}` : ''}</p></div>
          <Link className="btn btn-primary h-[42px] w-[140px]" to="/pricing">{currentPlan === 'plus' ? 'Renew Plan' : 'Upgrade'}</Link>
        </div>
        <div className="mt-5"><h3 className="text-xs font-bold uppercase text-base-content/60">Payment history</h3>{payments.length ? <ul className="mt-2 divide-y divide-base-200">{payments.map((payment) => <li className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={payment.id}><span>{payment.plan === 'plus' ? 'PBX Nursing Plus' : payment.plan}</span><span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: payment.currency }).format(payment.amount / 100)} · {payment.status} · {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</span></li>)}</ul> : <p className="mt-2 text-sm text-base-content/60">No payments yet.</p>}</div>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 px-6 py-6 md:px-8">
        <div className="mb-5 flex items-start gap-3 text-primary"><span className="material-symbols-outlined">redeem</span><div><h2 className="font-bold text-base-content">Referral & wallet</h2><p className="text-sm text-base-content/60">Share your code with friends to earn rewards</p></div></div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-base-200 p-5">
          {referralQuery.isLoading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : referralQuery.isError ? (
            <p className="text-sm text-error">{getApiErrorMessage(referralQuery.error)}</p>
          ) : (
            <>
              <strong className="font-mono text-lg tracking-widest">{referralQuery.data?.code}</strong>
              <button className="btn btn-outline btn-sm" type="button" onClick={copyReferralCode}>{referralCopied ? 'Copied!' : 'Copy code'}</button>
            </>
          )}
        </div>
        {referralQuery.data ? (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div><p className="text-xs uppercase text-base-content/50">Coin balance</p><strong>{referralQuery.data.coinBalance}</strong></div>
            <div><p className="text-xs uppercase text-base-content/50">Successful referrals</p><strong>{referralQuery.data.successfulReferralCount}</strong></div>
            <div><p className="text-xs uppercase text-base-content/50">Banked free months</p><strong>{referralQuery.data.bankedFreeMonths}</strong></div>
          </div>
        ) : null}
        {activateStatus ? <div className={`alert mt-4 text-sm ${activateStatus.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status"><span>{activateStatus.message}</span></div> : null}
        {referralQuery.data?.bankedFreeMonths > 0 ? (
          <button
            className="btn btn-primary btn-sm mt-4"
            type="button"
            disabled={activateFreeMonthMutation.isPending}
            onClick={activateOneFreeMonth}
          >
            {activateFreeMonthMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : null}Activate a free month
          </button>
        ) : null}
      </section>

    </div>
  )
}

function PageBody({ page, currentPlan, onLogout, onPaymentComplete, onSetPassword, onUpdateProfile, pricingContent, user }) {
  if (page === 'dashboard') return <DashboardPageContent user={user} />
  if (page === 'performance') return <PerformancePageContent />
  if (page === 'createTest') return <CreateTestPageContent />
  if (page === 'tests') return <TestsPageContent />
  if (page === 'feedback') return <FeedbackPageContent />
  if (page === 'highlights') return <HighlightsPageContent />
  if (page === 'notes') return <NotesPageContent />
  if (page === 'pricing') return <PricingPageContent currentPlan={currentPlan} pricingContent={pricingContent} />
  if (page === 'payment') return <PaymentPageContent onPaymentComplete={onPaymentComplete} pricingContent={pricingContent} />
  if (page === 'profile') return <ProfilePageContent currentPlan={currentPlan} onLogout={onLogout} onSetPassword={onSetPassword} onUpdateProfile={onUpdateProfile} user={user} />

  return <DashboardPageContent user={user} />
}

function HomePage({ page = 'dashboard' }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const content = getPageContent(page)
  const user = auth.user || { name: 'PBX learner', email: '' }
  const currentPlan = getUserPlan(user)
  const pricingContent = usePlanCatalog()
  const activateFreeMonthMutation = useMutation({ mutationFn: activateFreeMonth })
  const activateFreeMonthFromPrompt = async () => {
    await activateFreeMonthMutation.mutateAsync()
    await queryClient.invalidateQueries({ queryKey: queryKeys.referralSummary })
    await queryClient.invalidateQueries({ queryKey: queryKeys.session })
    auth.dismissFreeMonthPrompt()
  }

  return (
    <>
      <DrawerShell
      account={(
        <AccountPanel
          membershipLabel={getMembershipLabel(user)}
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
      mainClassName={page === 'createTest' ? 'bg-white' : 'bg-base-200'}
      navGroups={navGroups}
      title={content.title}
      user={user}
    >
      <PageBody currentPlan={currentPlan} onLogout={auth.logout} onPaymentComplete={auth.refreshUser} onSetPassword={auth.setPassword} onUpdateProfile={auth.updateProfile} page={page} pricingContent={pricingContent} user={user} />
      </DrawerShell>
      {auth.shouldPromptForPassword && page !== 'profile' ? (
        <Modal title="Set a password?" onClose={auth.dismissPasswordPrompt}>
          <p className="text-base-content/70">
            Add a password if you would also like to sign in with your email address. You can skip this and continue using your current sign-in method.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button className="btn btn-ghost" type="button" onClick={auth.dismissPasswordPrompt}>Not now</button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                auth.dismissPasswordPrompt()
                navigate('/profile')
              }}
            >
              Set password
            </button>
          </div>
        </Modal>
      ) : null}
      {!auth.shouldPromptForPassword && auth.shouldPromptForFreeMonth && page !== 'profile' ? (
        <Modal title="You've earned a free month!" onClose={auth.dismissFreeMonthPrompt}>
          <p className="text-base-content/70">
            Your referrals have earned you a banked free month of PBX Nursing Plus. Activate it now to extend your membership.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button className="btn btn-ghost" type="button" onClick={auth.dismissFreeMonthPrompt}>Not now</button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={activateFreeMonthMutation.isPending}
              onClick={activateFreeMonthFromPrompt}
            >
              {activateFreeMonthMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : null}Activate now
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}

export default HomePage
