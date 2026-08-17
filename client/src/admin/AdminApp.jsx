import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { brand } from '../content/landing/index.js'
import { apiRequest } from '../services/apiClient.js'
import DrawerShell, { AccountIdentity, AccountPanel } from '../ui/layout/DrawerShell.jsx'
import QuestionReviewModal, { QuestionReviewScreen } from '../ui/questionnaire/QuestionReviewModal.jsx'
import { ADMIN_ROUTE } from './adminRoute.js'
import { queryKeys } from '../services/queryKeys.js'

function adminRequest(path, options = {}) {
  return apiRequest(path, {
    ...options,
    skipAuthRefresh: true,
  })
}

function LoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-base-100" data-theme="nord">
      <span className="loading loading-spinner loading-lg text-primary" />
    </main>
  )
}

function useAdminSession() {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({ queryKey: queryKeys.adminSession, queryFn: ({ signal }) => adminRequest('/admin/me', { signal }), retry: false })
  const loginMutation = useMutation({ mutationFn: (values) => adminRequest('/admin/auth/login', { method: 'POST', body: values }) })
  const logoutMutation = useMutation({ mutationFn: () => adminRequest('/admin/auth/logout', { method: 'POST' }) })
  const admin = sessionQuery.data?.admin || null
  const loading = sessionQuery.isPending

  return useMemo(() => ({
    admin,
    loading,
    async login(values) {
      const payload = await loginMutation.mutateAsync(values)
      queryClient.setQueryData(queryKeys.adminSession, payload)
    },
    async logout() {
      await logoutMutation.mutateAsync()
      queryClient.removeQueries({ queryKey: ['admin'] })
    },
  }), [admin, loading, loginMutation, logoutMutation, queryClient])
}

const AdminContext = React.createContext(null)

const adminNavGroups = [
  {
    label: 'Admin',
    items: [
      { href: ADMIN_ROUTE, label: 'Dashboard', icon: 'dashboard', end: true },
      { href: `${ADMIN_ROUTE}/users`, label: 'Users', icon: 'group' },
      { href: `${ADMIN_ROUTE}/questions`, label: 'Questions', icon: 'quiz' },
      { href: `${ADMIN_ROUTE}/feedback`, label: 'Feedback', icon: 'feedback' },
      { href: `${ADMIN_ROUTE}/promo-codes`, label: 'Promo codes', icon: 'sell' },
    ],
  },
]

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
      navigate(ADMIN_ROUTE)
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
          <p className="text-xs font-black uppercase text-primary">PBX Nursing</p>
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
  if (!admin.admin) return <Navigate replace to={`${ADMIN_ROUTE}/login`} />

  return children
}

function Layout({ children, title }) {
  const admin = useAdmin()

  return (
    <DrawerShell
      account={(
        <AccountPanel
          onLogout={admin.logout}
        />
      )}
      accountIdentity={(
        <AccountIdentity
          badge={{ className: 'badge-outline', label: 'Admin' }}
          caption="Admin workspace"
          name={admin.admin?.username || 'Admin'}
        />
      )}
      brand={brand}
      drawerId="admin-drawer"
      navAriaLabel="Admin pages"
      navGroups={adminNavGroups}
      title={title}
    >
      {children}
    </DrawerShell>
  )
}

function InlineLoading() {
  return (
    <div className="grid min-h-48 place-items-center">
      <span className="loading loading-spinner loading-lg text-primary" />
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

function DataPage({ columns, endpoint, getPreviewPath, getPreviewQuestion, searchLabel, searchPlaceholder, title }) {
  const location = useLocation()
  const navigate = useNavigate()
  const restoredState = location.state?.dataPage?.endpoint === endpoint ? location.state.dataPage : null
  const [pageRequest, setPageRequest] = useState(() => restoredState?.pageRequest || { limit: 50, offset: 0 })
  const [searchDraft, setSearchDraft] = useState(() => restoredState?.searchDraft || '')
  const [searchQuery, setSearchQuery] = useState(() => restoredState?.searchQuery || '')
  const [previewQuestion, setPreviewQuestion] = useState(null)
  const hasPreview = Boolean(getPreviewPath || getPreviewQuestion)

  const params = { ...pageRequest, q: searchQuery || undefined }
  const dataQuery = useQuery({
    queryKey: queryKeys.adminResource(endpoint, params),
    queryFn: ({ signal }) => {
    const search = new URLSearchParams({
      limit: String(pageRequest.limit),
      offset: String(pageRequest.offset),
    })

    if (searchQuery) {
      search.set('q', searchQuery)
    }

      return adminRequest(`${endpoint}?${search}`, { signal })
    },
    placeholderData: (previousData) => previousData,
  })
  const key = getEndpointKey(endpoint)
  const pagination = dataQuery.data?.pagination || null
  const rows = dataQuery.data?.[key] || []

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
    <Layout title={title}>
      {dataQuery.isPending ? <InlineLoading /> : null}
      {dataQuery.isError ? <div className="alert alert-error"><span>{dataQuery.error.message}</span></div> : null}
      {!dataQuery.isPending && !dataQuery.isError ? (
        <section className="surface-raised rounded-lg border p-4">
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
              <button className="btn btn-primary btn-sm" disabled={dataQuery.isFetching} type="submit">
                <span className="material-symbols-outlined">search</span>
                Search
              </button>
              {searchQuery ? (
                <button className="btn btn-ghost btn-sm" disabled={dataQuery.isFetching} type="button" onClick={clearSearch}>
                  <span className="material-symbols-outlined">close</span>
                  Clear
                </button>
              ) : null}
            </form>
          ) : null}
          <PaginationControls
            loading={dataQuery.isFetching}
            pagination={pagination}
            rowCount={rows.length}
            onLimitChange={changeLimit}
            onNext={nextPage}
            onPrevious={previousPage}
          />
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.label}>{column.label}</th>)}
                  {hasPreview ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => <td key={column.label}>{column.render(row)}</td>)}
                    {hasPreview ? (
                      <td className="text-right">
                        <button
                          className="btn btn-ghost btn-xs"
                          type="button"
                          disabled={!getPreviewPath?.(row) && !getPreviewQuestion?.(row)}
                          title="Preview question"
                          onClick={() => {
                            const question = getPreviewQuestion?.(row) || row
                            const previewPath = getPreviewPath?.(row)
                            if (previewPath) {
                              navigate(previewPath, {
                                state: {
                                  question,
                                  returnTo: location.pathname,
                                  listState: { endpoint, pageRequest, searchDraft, searchQuery },
                                },
                              })
                            } else {
                              setPreviewQuestion(question)
                            }
                          }}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                          Preview
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (hasPreview ? 1 : 0)}>No records found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <PaginationControls
              loading={dataQuery.isFetching}
              pagination={pagination}
              rowCount={rows.length}
              onLimitChange={changeLimit}
              onNext={nextPage}
              onPrevious={previousPage}
            />
          </div>
          {previewQuestion ? <QuestionReviewModal question={previewQuestion} showResult={false} onClose={() => setPreviewQuestion(null)} /> : null}
        </section>
      ) : null}
    </Layout>
  )
}

function DashboardPage() {
  const dashboardQuery = useQuery({ queryKey: queryKeys.adminDashboard, queryFn: ({ signal }) => adminRequest('/admin/dashboard', { signal }) })

  return (
    <Layout title="Dashboard">
      {dashboardQuery.isPending ? <InlineLoading /> : null}
      {dashboardQuery.isError ? <div className="alert alert-error"><span>{dashboardQuery.error.message}</span></div> : null}
      {dashboardQuery.data ? (
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Users" value={dashboardQuery.data.users} />
          <StatCard label="Questions" value={dashboardQuery.data.questions} />
          <StatCard label="Open feedback" value={dashboardQuery.data.openFeedback} />
        </section>
      ) : null}
    </Layout>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="card surface-raised">
      <div className="card-body">
        <p className="text-sm font-bold text-base-content/70">{label}</p>
        <strong className="text-4xl font-black">{value}</strong>
      </div>
    </article>
  )
}

function FeedbackDetailPage() {
  const { feedbackId } = useParams()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [previewQuestion, setPreviewQuestion] = useState(null)
  const detailKey = queryKeys.adminFeedbackDetail(feedbackId)
  const detailQuery = useQuery({ queryKey: detailKey, queryFn: ({ signal }) => adminRequest(`/admin/feedback/${feedbackId}`, { signal }) })
  const replyMutation = useMutation({ mutationFn: (body) => adminRequest(`/admin/feedback/${feedbackId}/reply`, { method: 'POST', body }) })
  const statusMutation = useMutation({ mutationFn: (status) => adminRequest(`/admin/feedback/${feedbackId}/status`, { method: 'PATCH', body: { status } }) })

  const reply = async (event) => {
    event.preventDefault()
    await replyMutation.mutateAsync({ message })
    setMessage('')
    await queryClient.invalidateQueries({ queryKey: detailKey })
  }

  const setStatus = async (status) => {
    await statusMutation.mutateAsync(status)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: detailKey }),
      queryClient.invalidateQueries({ queryKey: ['admin', '/admin/feedback'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard }),
    ])
  }

  return (
    <Layout title="Feedback">
      {detailQuery.isPending ? <InlineLoading /> : null}
      {detailQuery.isError ? <div className="alert alert-error"><span>{detailQuery.error.message}</span></div> : null}
      {detailQuery.data ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-primary">Feedback</p>
              <h1 className="text-3xl font-black">{detailQuery.data.thread.subject}</h1>
              <p className="text-sm text-base-content/70">{detailQuery.data.thread.user?.email}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="btn btn-outline"
                type="button"
                disabled={!detailQuery.data.thread.question}
                onClick={() => setPreviewQuestion(detailQuery.data.thread.question)}
              >
                <span className="material-symbols-outlined">visibility</span>
                Preview
              </button>
              <select className="select select-bordered" value={detailQuery.data.thread.status} onChange={(event) => setStatus(event.target.value)}>
                <option value="open">open</option>
                <option value="reviewing">reviewing</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </select>
            </div>
          </div>
          <section className="surface-raised grid gap-3 rounded-lg border p-4">
            {detailQuery.data.messages.map((item) => (
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
          {previewQuestion ? <QuestionReviewModal question={previewQuestion} showResult={false} onClose={() => setPreviewQuestion(null)} /> : null}
        </div>
      ) : null}
    </Layout>
  )
}

function PromoCodesPage() {
  const queryClient = useQueryClient()
  const promoKey = queryKeys.adminResource('/admin/promo-codes')
  const promoQuery = useQuery({ queryKey: promoKey, queryFn: ({ signal }) => adminRequest('/admin/promo-codes', { signal }) })
  const createMutation = useMutation({ mutationFn: (body) => adminRequest('/admin/promo-codes', { method: 'POST', body }) })
  const updateMutation = useMutation({ mutationFn: ({ id, body }) => adminRequest(`/admin/promo-codes/${id}`, { method: 'PATCH', body }) })
  const [form, setForm] = useState({ code: '', discountPercent: 20, maxRedemptions: '', expiresAt: '', active: true })
  const [message, setMessage] = useState('')

  const refresh = () => queryClient.invalidateQueries({ queryKey: promoKey })
  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    try {
      await createMutation.mutateAsync({
        code: form.code,
        discountPercent: Number(form.discountPercent),
        maxRedemptions: form.maxRedemptions === '' ? null : Number(form.maxRedemptions),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        active: form.active,
      })
      setForm({ code: '', discountPercent: 20, maxRedemptions: '', expiresAt: '', active: true })
      setMessage('Promo code created.')
      await refresh()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const setActive = async (promoCode) => {
    setMessage('')
    try {
      await updateMutation.mutateAsync({ id: promoCode.id, body: { active: !promoCode.active } })
      await refresh()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <Layout title="Promo codes">
      <div className="grid gap-6">
        <form className="surface-raised grid gap-4 rounded-xl border p-5 lg:grid-cols-5 lg:items-end" onSubmit={submit}>
          <label className="form-control gap-2">
            <span className="label-text font-bold">Code</span>
            <input className="input input-bordered uppercase" maxLength="40" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="SAVE20" />
          </label>
          <label className="form-control gap-2">
            <span className="label-text font-bold">Discount %</span>
            <input className="input input-bordered" min="1" max="100" required type="number" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value })} />
          </label>
          <label className="form-control gap-2">
            <span className="label-text font-bold">Maximum uses</span>
            <input className="input input-bordered" min="1" type="number" value={form.maxRedemptions} onChange={(event) => setForm({ ...form, maxRedemptions: event.target.value })} placeholder="Unlimited" />
          </label>
          <label className="form-control gap-2">
            <span className="label-text font-bold">Valid until</span>
            <input className="input input-bordered" type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
          </label>
          <button className="btn btn-primary" disabled={createMutation.isPending} type="submit">
            {createMutation.isPending ? <span className="loading loading-spinner loading-sm" /> : null}
            Add promo code
          </button>
          {message ? <p className="text-sm font-semibold lg:col-span-5">{message}</p> : null}
        </form>

        {promoQuery.isPending ? <InlineLoading /> : null}
        {promoQuery.isError ? <div className="alert alert-error"><span>{promoQuery.error.message}</span></div> : null}
        {promoQuery.data ? (
          <section className="surface-raised overflow-x-auto rounded-xl border">
            <table className="table">
              <thead><tr><th>Code</th><th>Discount</th><th>Usage</th><th>Expires</th><th>Status</th><th /></tr></thead>
              <tbody>
                {promoQuery.data.promoCodes.map((promoCode) => (
                  <tr key={promoCode.id}>
                    <td className="font-black">{promoCode.code}</td>
                    <td>{promoCode.discountPercent}%</td>
                    <td>{promoCode.redemptionCount} / {promoCode.maxRedemptions ?? 'Unlimited'}</td>
                    <td>{promoCode.expiresAt ? new Date(promoCode.expiresAt).toLocaleString() : 'No expiry'}</td>
                    <td><span className={`badge ${promoCode.active ? 'badge-primary' : 'badge-ghost'}`}>{promoCode.active ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-right"><button className="btn btn-outline btn-sm" disabled={updateMutation.isPending} type="button" onClick={() => setActive(promoCode)}>{promoCode.active ? 'Disable' : 'Enable'}</button></td>
                  </tr>
                ))}
                {promoQuery.data.promoCodes.length === 0 ? <tr><td colSpan="6" className="text-center text-base-content/60">No promo codes yet.</td></tr> : null}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </Layout>
  )
}

function QuestionPreviewPage() {
  const { questionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const initialQuestion = location.state?.question
  const questionQuery = useQuery({
    queryKey: queryKeys.adminResource(`/admin/questions/${questionId}`),
    queryFn: ({ signal }) => adminRequest(`/admin/questions/${questionId}`, { signal }),
    enabled: !initialQuestion,
    retry: false,
  })
  const question = initialQuestion || questionQuery.data?.question

  const close = () => {
    navigate(location.state?.returnTo || `${ADMIN_ROUTE}/questions`, {
      state: location.state?.listState ? { dataPage: location.state.listState } : undefined,
    })
  }

  if (!initialQuestion && questionQuery.isPending) return <LoadingPage />

  if (questionQuery.isError || !question) {
    return (
      <main className="grid h-screen place-items-center bg-base-100 p-6" data-theme="nord">
        <div className="grid max-w-xl gap-4">
          <div className="alert alert-warning"><span>{questionQuery.error?.message || 'Question not found.'}</span></div>
          <button className="btn btn-primary justify-self-center" type="button" onClick={close}>Back to questions</button>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden">
      <QuestionReviewScreen question={question} showResult={false} onClose={close} />
    </main>
  )
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="" element={<Protected><DashboardPage /></Protected>} />
      <Route
        path="users"
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
        path="questions"
        element={(
          <Protected>
            <DataPage
              title="Questions"
              endpoint="/admin/questions"
              getPreviewPath={(row) => `${ADMIN_ROUTE}/questions/${row.id}/preview`}
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
      <Route path="questions/:questionId/preview" element={<Protected><QuestionPreviewPage /></Protected>} />
      <Route
        path="feedback"
        element={(
          <Protected>
            <DataPage
              title="Feedback"
              endpoint="/admin/feedback"
              getPreviewQuestion={(row) => row.question}
              columns={[
                { label: 'Subject', render: (row) => <Link className="link" to={`${ADMIN_ROUTE}/feedback/${row.id}`}>{row.subject}</Link> },
                { label: 'User', render: (row) => row.user?.email || '-' },
                { label: 'Question', render: (row) => row.question ? `QID ${row.question.questionId}` : '-' },
                { label: 'Status', render: (row) => <span className="badge badge-outline">{row.status}</span> },
                { label: 'Updated', render: (row) => new Date(row.updatedAt).toLocaleString() },
              ]}
            />
          </Protected>
        )}
      />
      <Route path="feedback/:feedbackId" element={<Protected><FeedbackDetailPage /></Protected>} />
      <Route path="promo-codes" element={<Protected><PromoCodesPage /></Protected>} />
      <Route path="*" element={<Navigate replace to={ADMIN_ROUTE} />} />
    </Routes>
  )
}

function AdminApp() {
  const session = useAdminSession()

  return (
    <AdminContext.Provider value={session}>
      <AdminRoutes />
    </AdminContext.Provider>
  )
}

export default AdminApp
