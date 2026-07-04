import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
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

function DataPage({ columns, endpoint, title }) {
  const [state, setState] = useState({ loading: true, error: '', rows: [] })

  useEffect(() => {
    apiRequest(endpoint)
      .then((payload) => {
        const key = endpoint.includes('users') ? 'users' : endpoint.includes('questions') ? 'questions' : 'feedback'
        setState({ loading: false, error: '', rows: payload[key] || [] })
      })
      .catch((error) => setState({ loading: false, error: error.message, rows: [] }))
  }, [endpoint])

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
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.label}>{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => <td key={column.label}>{column.render(row)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <select className="select select-bordered" value={state.data.thread.status} onChange={(event) => setStatus(event.target.value)}>
              <option value="open">open</option>
              <option value="reviewing">reviewing</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
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
                  columns={[
                    { label: 'QID', render: (row) => row.questionId },
                    { label: 'Subject', render: (row) => row.taxonomy?.subject || '-' },
                    { label: 'System', render: (row) => row.taxonomy?.system || '-' },
                    { label: 'Type', render: (row) => row.questionTypeId },
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
                  columns={[
                    { label: 'Subject', render: (row) => <Link className="link" to={`/feedback/${row.id}`}>{row.subject}</Link> },
                    { label: 'User', render: (row) => row.user?.email || '-' },
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
