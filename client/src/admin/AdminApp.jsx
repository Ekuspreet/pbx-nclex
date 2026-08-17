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
    label: 'Overview',
    items: [
      { href: ADMIN_ROUTE, label: 'Dashboard', icon: 'dashboard', end: true },
      { href: `${ADMIN_ROUTE}/users`, label: 'Users', icon: 'group' },
      { href: `${ADMIN_ROUTE}/questions`, label: 'Questions', icon: 'quiz' },
      { href: `${ADMIN_ROUTE}/feedback`, label: 'Feedback', icon: 'feedback' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: `${ADMIN_ROUTE}/subscriptions`, label: 'Subscriptions', icon: 'workspace_premium' },
      { href: `${ADMIN_ROUTE}/payments`, label: 'Payments', icon: 'payments' },
      { href: `${ADMIN_ROUTE}/referrals`, label: 'Referrals', icon: 'group_add' },
      { href: `${ADMIN_ROUTE}/promo-codes`, label: 'Promo codes', icon: 'sell' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: `${ADMIN_ROUTE}/configuration`, label: 'Plans & settings', icon: 'tune' },
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
  if (endpoint.includes('subscriptions')) return 'subscriptions'
  if (endpoint.includes('payments')) return 'payments'
  if (endpoint.includes('referrals')) return 'referrals'
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
        <div className="grid gap-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon="group" label="Users" value={dashboardQuery.data.metrics.totalUsers} detail={`${dashboardQuery.data.metrics.verifiedUsers} verified`} />
            <StatCard icon="workspace_premium" label="Active subscriptions" value={dashboardQuery.data.metrics.activeSubscriptions} detail={`${dashboardQuery.data.metrics.paidOrders} paid orders`} />
            <StatCard icon="payments" label="Revenue collected" value={formatMoney(dashboardQuery.data.metrics.revenuePaise)} detail="Captured orders" />
            <StatCard icon="group_add" label="Referral conversions" value={dashboardQuery.data.metrics.referrals} detail={`${dashboardQuery.data.metrics.walletCoins} wallet coins outstanding`} />
            <StatCard icon="quiz" label="Question bank" value={dashboardQuery.data.metrics.totalQuestions} detail="Available questions" />
            <StatCard icon="sell" label="Active promos" value={dashboardQuery.data.metrics.activePromos} detail="Currently enabled" />
            <StatCard icon="feedback" label="Open feedback" value={dashboardQuery.data.metrics.openFeedback} detail="Needs attention" />
            <StatCard icon="redeem" label="Banked free months" value={dashboardQuery.data.metrics.bankedFreeMonths} detail="Across user wallets" />
          </section>
          <section className="surface-raised overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div><h2 className="text-lg font-black">Recent payment activity</h2><p className="text-sm text-base-content/60">Latest orders across all users</p></div>
              <Link className="btn btn-outline btn-sm" to={`${ADMIN_ROUTE}/payments`}>View all</Link>
            </div>
            <div className="overflow-x-auto"><table className="table"><thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>
              {dashboardQuery.data.recentPayments.map((payment) => <tr key={payment.id}><td><strong>{payment.userName}</strong><br /><span className="text-xs text-base-content/60">{payment.userEmail}</span></td><td>{formatMoney(payment.amount, payment.currency)}</td><td><StatusBadge value={payment.status} /></td><td>{formatDate(payment.createdAt)}</td></tr>)}
              {dashboardQuery.data.recentPayments.length === 0 ? <tr><td className="text-center" colSpan="4">No payment activity yet.</td></tr> : null}
            </tbody></table></div>
          </section>
        </div>
      ) : null}
    </Layout>
  )
}

function StatCard({ detail, icon, label, value }) {
  return (
    <article className="card surface-raised border">
      <div className="card-body gap-2 p-5">
        <div className="flex items-center justify-between"><p className="text-sm font-bold text-base-content/70">{label}</p><span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">{icon}</span></div>
        <strong className="text-3xl font-black">{value}</strong>
        <p className="text-xs text-base-content/55">{detail}</p>
      </div>
    </article>
  )
}

function formatMoney(paise, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format((paise || 0) / 100)
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—'
}

function StatusBadge({ value }) {
  const positive = ['paid', 'active', 'published'].includes(String(value).toLowerCase())
  return <span className={`badge ${positive ? 'badge-primary' : 'badge-outline'}`}>{value}</span>
}

function ConfigurationPage() {
  const configKey = queryKeys.adminResource('/admin/configuration')
  const configQuery = useQuery({ queryKey: configKey, queryFn: ({ signal }) => adminRequest('/admin/configuration', { signal }) })

  return (
    <Layout title="Plans & settings">
      {configQuery.isPending ? <InlineLoading /> : null}
      {configQuery.isError ? <div className="alert alert-error"><span>{configQuery.error.message}</span></div> : null}
      {configQuery.data ? <div className="grid gap-6">
        <ConfigSection icon="workspace_premium" title="Subscription plans" subtitle="Pricing, access duration and entitlement limits">
          <table className="table"><thead><tr><th>Plan</th><th>Price</th><th>Duration</th><th>Entitlements</th><th>Status</th></tr></thead><tbody>{configQuery.data.plans.map((plan) => <tr key={plan.key}><td><strong>{plan.name}</strong><br /><span className="text-xs text-base-content/50">{plan.key}</span></td><td>{formatMoney(plan.amount, plan.currency)}</td><td>{plan.durationDays ? `${plan.durationDays} days` : 'Ongoing'}</td><td><code className="text-xs">{JSON.stringify(plan.limits)}</code></td><td><StatusBadge value={plan.active ? 'active' : 'inactive'} /></td></tr>)}</tbody></table>
        </ConfigSection>
        <ConfigSection icon="tune" title="Product settings" subtitle="Runtime limits and operational defaults stored in the database">
          <table className="table"><thead><tr><th>Setting</th><th>Value</th><th>Description</th><th>Updated</th></tr></thead><tbody>{configQuery.data.settings.map((setting) => <tr key={setting.key}><td className="font-mono text-xs font-bold">{setting.key}</td><td><code>{JSON.stringify(setting.value)}</code></td><td>{setting.description}</td><td>{formatDate(setting.updatedAt)}</td></tr>)}</tbody></table>
        </ConfigSection>
        <ConfigSection icon="group_add" title="Referral policy" subtitle="Reward tiers and free-month rules">
          <table className="table"><thead><tr><th>Referral range</th><th>Coins per referral</th><th>Free months</th><th>Status</th></tr></thead><tbody>{configQuery.data.referralTiers.map((tier) => <tr key={tier.minOrdinal}><td>{tier.minOrdinal}–{tier.maxOrdinal ?? '∞'}</td><td>{tier.coinsPerReferral}</td><td>{tier.freeMonthsPerReferral}</td><td><StatusBadge value={tier.active ? 'active' : 'inactive'} /></td></tr>)}</tbody></table>
          <div className="border-t p-4 text-sm">Free-month duration: <strong>{configQuery.data.referralProgram[0]?.freeMonthDurationDays ?? '—'} days</strong></div>
        </ConfigSection>
        <ConfigSection icon="policy" title="Policies & site content" subtitle="Published legal and marketing content versions">
          <table className="table"><thead><tr><th>Content key</th><th>Group</th><th>Version</th><th>Status</th><th>Effective</th><th>Updated</th><th>Content</th></tr></thead><tbody>{configQuery.data.content.map((entry) => <tr key={entry.key}><td className="font-bold">{entry.key}</td><td>{entry.group}</td><td>v{entry.version}</td><td><StatusBadge value={entry.published ? 'published' : 'draft'} /></td><td>{formatDate(entry.effectiveAt)}</td><td>{formatDate(entry.updatedAt)}</td><td><details className="dropdown dropdown-end"><summary className="btn btn-ghost btn-xs">Inspect</summary><pre className="dropdown-content z-10 mt-2 max-h-80 w-96 overflow-auto rounded-lg border bg-base-100 p-4 text-xs shadow-xl">{JSON.stringify(entry.content, null, 2)}</pre></details></td></tr>)}</tbody></table>
        </ConfigSection>
      </div> : null}
    </Layout>
  )
}

function ConfigSection({ children, icon, subtitle, title }) {
  return <section className="surface-raised overflow-x-auto rounded-xl border"><header className="flex items-center gap-3 border-b p-5"><span className="material-symbols-outlined text-primary">{icon}</span><div><h2 className="font-black">{title}</h2><p className="text-sm text-base-content/60">{subtitle}</p></div></header>{children}</section>
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
      <Route path="subscriptions" element={<Protected><DataPage title="Subscriptions" endpoint="/admin/subscriptions" columns={[
        { label: 'Subscriber', render: (row) => <><strong>{row.userName}</strong><br /><span className="text-xs text-base-content/60">{row.userEmail}</span></> },
        { label: 'Plan', render: (row) => row.plan },
        { label: 'Source', render: (row) => <span className="badge badge-outline">{row.source.replaceAll('_', ' ')}</span> },
        { label: 'Starts', render: (row) => formatDate(row.startsAt) },
        { label: 'Expires', render: (row) => formatDate(row.expiresAt) },
        { label: 'Status', render: (row) => <StatusBadge value={new Date(row.expiresAt) > new Date() ? 'active' : 'expired'} /> },
      ]} /></Protected>} />
      <Route path="payments" element={<Protected><DataPage title="Payments" endpoint="/admin/payments" columns={[
        { label: 'Customer', render: (row) => <><strong>{row.userName}</strong><br /><span className="text-xs text-base-content/60">{row.userEmail}</span></> },
        { label: 'Amount', render: (row) => formatMoney(row.amount, row.currency) },
        { label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
        { label: 'Discount', render: (row) => formatMoney(row.discountAmount, row.currency) },
        { label: 'Wallet coins', render: (row) => row.walletCoinsRedeemed },
        { label: 'Created', render: (row) => formatDate(row.createdAt) },
      ]} /></Protected>} />
      <Route path="referrals" element={<Protected><DataPage title="Referral conversions" endpoint="/admin/referrals" columns={[
        { label: 'Referrer', render: (row) => <><strong>{row.referrerName}</strong><br /><span className="text-xs text-base-content/60">{row.referrerEmail}</span></> },
        { label: 'Referred user', render: (row) => <><strong>{row.refereeName}</strong><br /><span className="text-xs text-base-content/60">{row.refereeEmail}</span></> },
        { label: 'Referral #', render: (row) => row.ordinal },
        { label: 'Coins awarded', render: (row) => row.coinsAwarded },
        { label: 'Free months', render: (row) => row.freeMonthsAwarded },
        { label: 'Converted', render: (row) => formatDate(row.createdAt) },
      ]} /></Protected>} />
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
      <Route path="configuration" element={<Protected><ConfigurationPage /></Protected>} />
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
