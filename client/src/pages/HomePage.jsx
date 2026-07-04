import { useCallback, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { brand, pricing } from '../content/landing/index.js'
import {
  createTest,
  deleteHighlight,
  deleteNote,
  getDashboard,
  getQuestionStats,
  listFeedback,
  listHighlights,
  listNotes,
  listTests,
} from '../services/studyAdapter.js'
import BrandLogo from '../ui/landing/BrandLogo.jsx'

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
  dashboard: { eyebrow: 'Dashboard', title: 'Dashboard' },
  createTest: { eyebrow: 'Tests', title: 'Create Test' },
  tests: { eyebrow: 'Tests', title: 'Tests' },
  pricing: { eyebrow: 'Pricing', title: 'Pricing' },
  payment: { eyebrow: 'Payment', title: 'Upgrade to Plus' },
  feedback: { eyebrow: 'Feedback', title: 'Feedback' },
  highlights: { eyebrow: 'Highlights', title: 'Highlights' },
  notes: { eyebrow: 'Notes', title: 'Notes' },
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
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

function StatCard({ label, value, icon }) {
  return (
    <article className="card surface-raised">
      <div className="card-body p-md gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-bold text-muted">{label}</p>
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <strong className="text-h3">{value}</strong>
      </div>
    </article>
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

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon="quiz" label="Total questions" value={data.totalQuestions} />
        <StatCard icon="task_alt" label="Attempted" value={data.attemptedQuestions} />
        <StatCard icon="assignment" label="Recent tests" value={data.tests?.length || 0} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <StatTable rows={data.subjects} title="Subjects" />
        <StatTable rows={data.systems} title="Systems" />
      </section>

      <section className="surface-raised rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-h3">Recent Tests</h2>
          <a className="btn btn-primary btn-sm" href="/tests/create">Create test</a>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Status</th>
                <th>Questions</th>
                <th>Mode</th>
                <th>Score</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data.tests || []).map((test) => (
                <tr key={test.id}>
                  <td><span className="badge badge-outline">{test.status}</span></td>
                  <td>{test.questionCount}</td>
                  <td>{test.tutorMode ? 'Tutor' : 'Test'} / {test.timed ? 'Timed' : 'Untimed'}</td>
                  <td>{test.scoreSummary?.percentage ?? '-'}%</td>
                  <td className="text-right">
                    <a className="btn btn-ghost btn-xs" href={test.status === 'completed' ? `/tests/${test.id}/result` : `/tests/${test.id}`}>
                      Open
                    </a>
                  </td>
                </tr>
              ))}
              {(!data.tests || data.tests.length === 0) ? (
                <tr>
                  <td colSpan="5">No tests yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatTable({ rows = [], title }) {
  return (
    <section className="surface-raised rounded-lg border p-4">
      <h2 className="text-h3 mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total</th>
              <th>Attempted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{row.totalQuestions}</td>
                <td>{row.attemptedQuestions}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan="3">No statistics available yet.</td>
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

  return (
    <form className="grid gap-6" onSubmit={submit}>
      {submitError ? <ErrorState message={submitError} /> : null}

      <section className="surface-raised rounded-lg border p-4">
        <h2 className="text-h3 mb-4">Test Props</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.tutorMode} onChange={(event) => setForm({ ...form, tutorMode: event.target.checked })} />
            <span className="label-text font-bold">Tutor Mode</span>
          </label>
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.timed} onChange={(event) => setForm({ ...form, timed: event.target.checked })} />
            <span className="label-text font-bold">Timer</span>
          </label>
          <label className="label cursor-pointer justify-start gap-3">
            <input className="toggle toggle-primary" type="checkbox" checked={form.showRationales} onChange={(event) => setForm({ ...form, showRationales: event.target.checked })} />
            <span className="label-text font-bold">Show Rationales</span>
          </label>
          <label className="form-control">
            <span className="label-text font-bold">Questions</span>
            <input
              className="input input-bordered"
              max="80"
              min="1"
              type="number"
              value={form.questionCount}
              onChange={(event) => setForm({ ...form, questionCount: event.target.value })}
            />
          </label>
        </div>
      </section>

      <FilterPicker
        label="Subjects"
        options={statsState.data.subjects}
        selected={form.subjects}
        onToggle={(key) => toggle('subjects', key)}
      />
      <FilterPicker
        label="Systems"
        options={statsState.data.systems}
        selected={form.systems}
        onToggle={(key) => toggle('systems', key)}
      />

      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={submitting} type="submit">
          {submitting ? <span className="loading loading-spinner loading-sm" /> : null}
          Generate Test
        </button>
      </div>
    </form>
  )
}

function FilterPicker({ label, options = [], selected = [], onToggle }) {
  return (
    <section className="surface-raised rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h3">{label}</h2>
        <span className="badge badge-outline">{selected.length === 0 ? 'All selected' : `${selected.length} selected`}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <label className="label cursor-pointer justify-start gap-3 rounded border border-base-300 px-3" key={option.key}>
            <input
              className="checkbox checkbox-primary checkbox-sm"
              checked={selected.includes(option.key)}
              type="checkbox"
              onChange={() => onToggle(option.key)}
            />
            <span className="label-text min-w-0 flex-1 truncate">{option.label}</span>
            <span className="badge badge-ghost">{option.totalQuestions}</span>
          </label>
        ))}
      </div>
    </section>
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
                <td className="text-right">
                  <button className="btn btn-ghost btn-xs" type="button" onClick={() => remove(row.id)}>Delete</button>
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
    </section>
  )
}

function FeedbackPageContent() {
  const [state, setState] = useState({ loading: true, error: '', rows: [] })

  useEffect(() => {
    listFeedback()
      .then((payload) => setState({ loading: false, error: '', rows: payload.feedback || [] }))
      .catch((error) => setState({ loading: false, error: error.message, rows: [] }))
  }, [])

  if (state.loading) return <LoadingState />

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
              </tr>
            </thead>
            <tbody>
              {state.rows.map((thread) => (
                <tr key={thread.id}>
                  <td>{thread.subject}</td>
                  <td><span className="badge badge-outline">{thread.status}</span></td>
                  <td>{thread.question ? `QID ${thread.question.questionId}` : '-'}</td>
                  <td>{new Date(thread.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {state.rows.length === 0 ? (
                <tr>
                  <td colSpan="4">No feedback threads yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
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

function HomeHeader({ onOpenSidebar }) {
  return (
    <header className="surface-sticky">
      <div className="navbar min-h-20 px-4 md:px-8">
        <div className="navbar-start gap-2">
          <button className="btn btn-ghost btn-square lg:hidden" type="button" onClick={onOpenSidebar} aria-label="Open app navigation">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <BrandLogo brand={brand} />
        </div>
      </div>
    </header>
  )
}

function SidebarLink({ item, onNavigate }) {
  return (
    <NavLink className={({ isActive }) => `font-bold ${isActive ? 'active font-black' : ''}`} end={item.end} onClick={onNavigate} to={item.href}>
      <span className="material-symbols-outlined">{item.icon}</span>
      {item.label}
    </NavLink>
  )
}

function SidebarAccount({ currentPlan, onLogout, user }) {
  return (
    <section className="border-t border-base-300 p-3">
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <div className="avatar avatar-placeholder shrink-0" aria-label={`${user.name} profile`}>
          <div className="w-11 rounded-full bg-primary text-primary-content">
            <span className="text-sm font-black">{getInitials(user.name)}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-black">{user.name}</p>
            <span className={`badge badge-sm shrink-0 ${getPlanBadgeClass(currentPlan)}`}>
              {currentPlan === 'plus' ? 'Plus' : 'Free'}
            </span>
          </div>
          <p className="text-caption text-muted -mt-1">NCLEX learner</p>
        </div>
      </div>
      <button className="btn btn-outline btn-sm w-full justify-start" type="button" onClick={onLogout}>
        <span className="material-symbols-outlined">logout</span>
        Log out
      </button>
    </section>
  )
}

function HomeSidebar({ currentPlan, onClose, onLogout, user }) {
  return (
    <aside className="flex min-h-full w-72 flex-col bg-base-100 text-base-content lg:border-r lg:border-base-300">
      <div className="flex justify-end border-b border-base-300 p-3 lg:hidden">
        <button className="btn btn-ghost btn-square" type="button" onClick={onClose} aria-label="Close app navigation">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="App pages">
        {navGroups.map((group) => (
          <ul className="menu gap-1" key={group.label}>
            <li className="menu-title">{group.label}</li>
            {group.items.map((item) => (
              <li key={item.label}>
                <SidebarLink item={item} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        ))}
      </nav>

      <SidebarAccount
        currentPlan={currentPlan}
        onLogout={onLogout}
        user={user}
      />
    </aside>
  )
}

function HomePage({ page = 'dashboard' }) {
  const auth = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const content = getPageContent(page)
  const user = auth.user || { name: 'PBX learner', email: '' }
  const currentPlan = getUserPlan(user)

  return (
    <div className="drawer lg:drawer-open surface-page min-h-screen" data-theme="nord">
      <input id="home-drawer" type="checkbox" className="drawer-toggle" checked={sidebarOpen} onChange={(event) => setSidebarOpen(event.target.checked)} />

      <div className="drawer-content flex min-h-screen flex-col">
        <HomeHeader onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="surface-muted flex-1">
          <section className="container-page grid min-h-[calc(100vh-5rem)] content-start gap-8 py-10 md:py-12">
            <div className="grid gap-3">
              <p className="text-kicker">{content.eyebrow}</p>
              <h1 className="text-h2">{content.title}</h1>
            </div>
            <PageBody currentPlan={currentPlan} page={page} />
          </section>
        </main>
      </div>

      <div className="drawer-side z-50 lg:z-0">
        <label htmlFor="home-drawer" aria-label="Close app navigation" className="drawer-overlay lg:hidden" />
        <HomeSidebar
          currentPlan={currentPlan}
          onClose={() => setSidebarOpen(false)}
          onLogout={auth.logout}
          user={user}
        />
      </div>
    </div>
  )
}

export default HomePage
