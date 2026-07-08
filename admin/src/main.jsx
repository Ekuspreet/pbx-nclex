import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import ExamQuestionPreviewModal from '../../client/src/ui/questionnaire/ExamQuestionPreviewModal.jsx'
import { apiRequest } from './apiClient.js'
import './index.css'

function LoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-base-100" data-theme="nord">
      <span className="loading loading-spinner loading-lg text-primary" />
    </main>
  )
}

function useAdminSession() {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/admin/me')
      .then((payload) => setAdmin(payload.admin))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false))
  }, [])

  return useMemo(() => ({
    admin,
    loading,
    async login(values) {
      const payload = await apiRequest('/admin/auth/login', { method: 'POST', body: values })
      setAdmin(payload.admin)
    },
    async logout() {
      await apiRequest('/admin/auth/logout', { method: 'POST' })
      setAdmin(null)
    },
  }), [admin, loading])
}

const AdminContext = React.createContext(null)

function useAdmin() {
  return React.useContext(AdminContext)
}

function LoginPage() {
  const admin = useAdmin()
  const navigate = useNavigate()
  const [values, setValues] = useState({ username: 'admin', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await admin.login(values)
      navigate('/')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-base-200 p-4" data-theme="nord">
      <form className="card w-full max-w-sm bg-base-100 shadow-xl" onSubmit={submit}>
        <div className="card-body">
          <p className="text-xs font-black uppercase text-primary">PBX NCLEX</p>
          <h1 className="text-3xl font-black">Admin Login</h1>
          {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
          <label className="form-control gap-2">
            <span className="label-text font-bold">Username</span>
            <input className="input input-bordered" value={values.username} onChange={(event) => setValues({ ...values, username: event.target.value })} />
          </label>
          <label className="form-control gap-2">
            <span className="label-text font-bold">Password</span>
            <input className="input input-bordered" type="password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} />
          </label>
          <button className="btn btn-primary mt-2" disabled={loading} type="submit">
            {loading ? <span className="loading loading-spinner loading-sm" /> : null}
            Login
          </button>
        </div>
      </form>
    </main>
  )
}

function Protected({ children }) {
  const admin = useAdmin()

  if (admin.loading) return <LoadingPage />
  if (!admin.admin) return <Navigate replace to="/login" />

  return children
}

function Layout({ children }) {
  const admin = useAdmin()
  const links = [
    { href: '/', label: 'Dashboard', icon: 'dashboard', end: true },
    { href: '/users', label: 'Users', icon: 'group' },
    { href: '/questions', label: 'Questions', icon: 'quiz' },
    { href: '/feedback', label: 'Feedback', icon: 'feedback' },
  ]

  return (
    <div className="min-h-screen bg-base-200 text-base-content" data-theme="nord">
      <header className="navbar border-b border-base-300 bg-base-100 px-4">
        <div className="navbar-start">
          <Link className="text-xl font-black" to="/">PBX Admin</Link>
        </div>
        <div className="navbar-end gap-2">
          <span className="badge badge-outline">{admin.admin?.username}</span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={admin.logout}>Logout</button>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="border-r border-base-300 bg-base-100 p-3">
          <nav className="menu gap-1">
            {links.map((link) => (
              <NavLink className={({ isActive }) => isActive ? 'active font-black' : 'font-bold'} end={link.end} key={link.href} to={link.href}>
                <span className="material-symbols-outlined">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}

const PAGE_SIZE_OPTIONS = [50, 100, 200]

function getEndpointKey(endpoint) {
  if (endpoint.includes('users')) return 'users'
  if (endpoint.includes('questions')) return 'questions'
  return 'feedback'
}

function PaginationControls({ loading, pagination, rowCount, onLimitChange, onNext, onPrevious }) {
  if (!pagination) return null

  const start = pagination.total > 0 ? pagination.offset + 1 : 0
  const end = Math.min(pagination.offset + rowCount, pagination.total)
  const canPrevious = pagination.offset > 0
  const canNext = pagination.offset + pagination.limit < pagination.total

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-bold text-base-content/70">
        Showing {start}-{end} of {pagination.total} | Page {pagination.page} of {pagination.pageCount}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="select select-bordered select-sm"
          disabled={loading}
          value={pagination.limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((value) => (
            <option key={value} value={value}>{value} / page</option>
          ))}
        </select>
        <button className="btn btn-outline btn-sm" disabled={loading || !canPrevious} type="button" onClick={onPrevious}>
          Previous
        </button>
        <button className="btn btn-outline btn-sm" disabled={loading || !canNext} type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  )
}

function DataPage({ columns, endpoint, getPreviewQuestion, searchLabel, searchPlaceholder, title }) {
  const [state, setState] = useState({ loading: true, error: '', pagination: null, rows: [] })
  const [pageRequest, setPageRequest] = useState({ limit: 50, offset: 0 })
  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewQuestion, setPreviewQuestion] = useState(null)

  useEffect(() => {
    let active = true
    const search = new URLSearchParams({
      limit: String(pageRequest.limit),
      offset: String(pageRequest.offset),
    })

    if (searchQuery) {
      search.set('q', searchQuery)
    }

    setState((current) => ({ ...current, loading: true, error: '' }))

    apiRequest(`${endpoint}?${search}`)
      .then((payload) => {
        if (!active) return
        const key = getEndpointKey(endpoint)
        setState({
          loading: false,
          error: '',
          pagination: payload.pagination || null,
          rows: payload[key] || [],
        })
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message, pagination: null, rows: [] })
      })

    return () => {
      active = false
    }
  }, [endpoint, pageRequest.limit, pageRequest.offset, searchQuery])

  const submitSearch = (event) => {
    event.preventDefault()
    setSearchQuery(searchDraft.trim())
    setPageRequest((current) => ({ ...current, offset: 0 }))
  }

  const clearSearch = () => {
    setSearchDraft('')
    setSearchQuery('')
    setPageRequest((current) => ({ ...current, offset: 0 }))
  }

  const changeLimit = (limit) => {
    setPageRequest({ limit, offset: 0 })
  }

  const previousPage = () => {
    setPageRequest((current) => ({
      ...current,
      offset: Math.max(0, current.offset - current.limit),
    }))
  }

  const nextPage = () => {
    setPageRequest((current) => ({
      ...current,
      offset: current.offset + current.limit,
    }))
  }

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-primary">Admin</p>
        <h1 className="text-4xl font-black">{title}</h1>
      </div>
      {state.loading ? <LoadingPage /> : null}
      {state.error ? <div className="alert alert-error"><span>{state.error}</span></div> : null}
      {!state.loading && !state.error ? (
        <section className="rounded-lg border border-base-300 bg-base-100 p-4">
          {searchLabel ? (
            <form className="mb-4 flex flex-wrap items-end gap-2" onSubmit={submitSearch}>
              <label className="form-control w-full max-w-xs gap-1">
                <span className="label-text font-bold">{searchLabel}</span>
                <input
                  className="input input-bordered input-sm"
                  inputMode="numeric"
                  placeholder={searchPlaceholder}
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                />
              </label>
              <button className="btn btn-primary btn-sm" disabled={state.loading} type="submit">
                <span className="material-symbols-outlined">search</span>
                Search
              </button>
              {searchQuery ? (
                <button className="btn btn-ghost btn-sm" disabled={state.loading} type="button" onClick={clearSearch}>
                  <span className="material-symbols-outlined">close</span>
                  Clear
                </button>
              ) : null}
            </form>
          ) : null}
          <PaginationControls
            loading={state.loading}
            pagination={state.pagination}
            rowCount={state.rows.length}
            onLimitChange={changeLimit}
            onNext={nextPage}
            onPrevious={previousPage}
          />
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.label}>{column.label}</th>)}
                  {getPreviewQuestion ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => <td key={column.label}>{column.render(row)}</td>)}
                    {getPreviewQuestion ? (
                      <td className="text-right">
                        <button
                          className="btn btn-ghost btn-xs"
                          type="button"
                          disabled={!getPreviewQuestion(row)}
                          title="Preview question"
                          onClick={() => setPreviewQuestion(getPreviewQuestion(row))}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                          Preview
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {state.rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (getPreviewQuestion ? 1 : 0)}>No records found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <PaginationControls
              loading={state.loading}
              pagination={state.pagination}
              rowCount={state.rows.length}
              onLimitChange={changeLimit}
              onNext={nextPage}
              onPrevious={previousPage}
            />
          </div>
          {previewQuestion ? <ExamQuestionPreviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} /> : null}
        </section>
      ) : null}
    </Layout>
  )
}

function DashboardPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    apiRequest('/admin/dashboard')
      .then((data) => setState({ loading: false, error: '', data }))
      .catch((error) => setState({ loading: false, error: error.message, data: null }))
  }, [])

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-primary">Admin</p>
        <h1 className="text-4xl font-black">Dashboard</h1>
      </div>
      {state.loading ? <span className="loading loading-spinner loading-lg" /> : null}
      {state.error ? <div className="alert alert-error"><span>{state.error}</span></div> : null}
      {state.data ? (
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Users" value={state.data.users} />
          <StatCard label="Questions" value={state.data.questions} />
          <StatCard label="Open feedback" value={state.data.openFeedback} />
        </section>
      ) : null}
    </Layout>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="card border border-base-300 bg-base-100">
      <div className="card-body">
        <p className="text-sm font-bold text-base-content/70">{label}</p>
        <strong className="text-4xl font-black">{value}</strong>
      </div>
    </article>
  )
}

function FeedbackDetailPage() {
  const { feedbackId } = useParams()
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [message, setMessage] = useState('')
  const [previewQuestion, setPreviewQuestion] = useState(null)

  const load = () => {
    apiRequest(`/admin/feedback/${feedbackId}`)
      .then((data) => setState({ loading: false, error: '', data }))
      .catch((error) => setState({ loading: false, error: error.message, data: null }))
  }

  useEffect(() => {
    load()
  }, [feedbackId])

  const reply = async (event) => {
    event.preventDefault()
    await apiRequest(`/admin/feedback/${feedbackId}/reply`, { method: 'POST', body: { message } })
    setMessage('')
    load()
  }

  const setStatus = async (status) => {
    await apiRequest(`/admin/feedback/${feedbackId}/status`, { method: 'PATCH', body: { status } })
    load()
  }

  return (
    <Layout>
      {state.loading ? <span className="loading loading-spinner loading-lg" /> : null}
      {state.error ? <div className="alert alert-error"><span>{state.error}</span></div> : null}
      {state.data ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-primary">Feedback</p>
              <h1 className="text-3xl font-black">{state.data.thread.subject}</h1>
              <p className="text-sm text-base-content/70">{state.data.thread.user?.email}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="btn btn-outline"
                type="button"
                disabled={!state.data.thread.question}
                onClick={() => setPreviewQuestion(state.data.thread.question)}
              >
                <span className="material-symbols-outlined">visibility</span>
                Preview
              </button>
              <select className="select select-bordered" value={state.data.thread.status} onChange={(event) => setStatus(event.target.value)}>
                <option value="open">open</option>
                <option value="reviewing">reviewing</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </select>
            </div>
          </div>
          <section className="grid gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
            {state.data.messages.map((item) => (
              <article className={`chat ${item.senderType === 'admin' ? 'chat-end' : 'chat-start'}`} key={item.id}>
                <div className="chat-header">{item.senderType}</div>
                <div className="chat-bubble">{item.message}</div>
              </article>
            ))}
          </section>
          <form className="flex gap-2" onSubmit={reply}>
            <input className="input input-bordered flex-1" value={message} onChange={(event) => setMessage(event.target.value)} />
            <button className="btn btn-primary" disabled={!message} type="submit">Reply</button>
          </form>
          {previewQuestion ? <ExamQuestionPreviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} /> : null}
        </div>
      ) : null}
    </Layout>
  )
}

function App() {
  const session = useAdminSession()

  return (
    <AdminContext.Provider value={session}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route
            path="/users"
            element={(
              <Protected>
                <DataPage
                  title="Users"
                  endpoint="/admin/users"
                  columns={[
                    { label: 'Name', render: (row) => row.name },
                    { label: 'Email', render: (row) => row.email },
                    { label: 'Status', render: (row) => <span className="badge badge-outline">{row.status}</span> },
                    { label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() },
                  ]}
                />
              </Protected>
            )}
          />
          <Route
            path="/questions"
            element={(
              <Protected>
                <DataPage
                  title="Questions"
                  endpoint="/admin/questions"
                  getPreviewQuestion={(row) => row}
                  searchLabel="Question ID"
                  searchPlaceholder="Search QID"
                  columns={[
                    { label: 'QID', render: (row) => row.questionId },
                    { label: 'Subject', render: (row) => row.taxonomy?.subject || '-' },
                    { label: 'System', render: (row) => row.taxonomy?.system || '-' },
                    { label: 'Type', render: (row) => row.questionTypeId },
                    { label: 'Exhibits', render: (row) => (row.exhibits || []).length },
                  ]}
                />
              </Protected>
            )}
          />
          <Route
            path="/feedback"
            element={(
              <Protected>
                <DataPage
                  title="Feedback"
                  endpoint="/admin/feedback"
                  getPreviewQuestion={(row) => row.question}
                  columns={[
                    { label: 'Subject', render: (row) => <Link className="link" to={`/feedback/${row.id}`}>{row.subject}</Link> },
                    { label: 'User', render: (row) => row.user?.email || '-' },
                    { label: 'Question', render: (row) => row.question ? `QID ${row.question.questionId}` : '-' },
                    { label: 'Status', render: (row) => <span className="badge badge-outline">{row.status}</span> },
                    { label: 'Updated', render: (row) => new Date(row.updatedAt).toLocaleString() },
                  ]}
                />
              </Protected>
            )}
          />
          <Route path="/feedback/:feedbackId" element={<Protected><FeedbackDetailPage /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AdminContext.Provider>
  )
}

createRoot(document.getElementById('root')).render(<App />)
