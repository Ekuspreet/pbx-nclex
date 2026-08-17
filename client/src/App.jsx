import { lazy, Suspense } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useQuery } from '@tanstack/react-query'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { GuestRoute, ProtectedRoute } from './auth/AuthRoutes.jsx'
import { ADMIN_ROUTE } from './admin/adminRoute.js'
import { queryKeys } from './services/queryKeys.js'

const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))
const AuthPage = lazy(() => import('./pages/auth/AuthPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'))
const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const PolicyPage = lazy(() => import('./pages/PolicyPage.jsx'))
const QuestionReviewPage = lazy(() => import('./pages/QuestionReviewPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'))
const TestPage = lazy(() => import('./pages/TestPage.jsx'))
const TestResultPage = lazy(() => import('./pages/TestResultPage.jsx'))
const TestReviewPage = lazy(() => import('./pages/TestReviewPage.jsx'))

function RouteFallback() {
  return <main className="grid min-h-screen place-items-center bg-base-100"><span className="loading loading-spinner loading-lg" /></main>
}

function MaintenancePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-base-200 px-6" data-theme="nord">
      <section className="w-full max-w-xl rounded-3xl border border-base-300 bg-base-100 p-8 text-center shadow-xl md:p-12">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined !text-4xl" aria-hidden="true">construction</span>
        </div>
        <p className="text-kicker">PBX Nursing</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Website under maintenance</h1>
        <p className="mt-4 text-base-content/70">We are making improvements and will be back shortly. Please try again later.</p>
      </section>
    </main>
  )
}

function getMaintenanceStatusUrl() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
  return `${apiBase}/maintenance-status`
}

function MaintenanceGate({ children }) {
  const statusQuery = useQuery({
    queryKey: queryKeys.maintenance,
    queryFn: async ({ signal }) => {
        const response = await fetch(getMaintenanceStatusUrl(), {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal,
        })
        if (!response.ok) throw new Error('Unable to check maintenance status.')
        return response.json()
    },
    refetchInterval: 15_000,
    retry: false,
  })

  if (statusQuery.isPending) return <RouteFallback />
  if (statusQuery.data?.maintenance === true) return <MaintenancePage />
  return children
}

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-base-100 p-6" data-theme="nord">
      <h1 className="text-2xl font-bold">PAGE NOT FOUND</h1>
      <p className="mt-2">The requested page does not exist.</p>
      <Link className="btn btn-primary mt-4" to="/">Return home</Link>
    </main>
  )
}

function AppProviders({ children }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const content = <AuthProvider>{children}</AuthProvider>

  if (!googleClientId) return content

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {content}
    </GoogleOAuthProvider>
  )
}

function App() {
  return (
    <MaintenanceGate>
      <AppProviders>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/terms-and-conditions" element={<PolicyPage contentKey="legal.terms" operatorNotice />} />
          <Route path="/privacy-policy" element={<PolicyPage contentKey="legal.privacy" />} />
          <Route path="/return-refund-policy" element={<PolicyPage contentKey="legal.refunds" />} />
          <Route path="/cancellation-policy" element={<PolicyPage contentKey="legal.cancellation" />} />
          <Route path="/disclaimer" element={<PolicyPage contentKey="legal.disclaimer" />} />
          <Route path={`${ADMIN_ROUTE}/*`} element={<AdminApp />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/verify-email" element={<Navigate replace to="/signup" />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage page="dashboard" />} />
            <Route path="/performance" element={<HomePage page="performance" />} />
            <Route path="/profile" element={<HomePage page="profile" />} />
            <Route path="/tests/create" element={<HomePage page="createTest" />} />
            <Route path="/tests" element={<HomePage page="tests" />} />
            <Route path="/tests/:testId" element={<TestPage />} />
            <Route path="/tests/:testId/result" element={<TestResultPage />} />
            <Route path="/tests/:testId/review" element={<TestReviewPage />} />
            <Route path="/pricing" element={<HomePage page="pricing" />} />
            <Route path="/payment" element={<HomePage page="payment" />} />
            <Route path="/feedback" element={<HomePage page="feedback" />} />
            <Route path="/highlights" element={<HomePage page="highlights" />} />
            <Route path="/highlights/:highlightId/review" element={<QuestionReviewPage />} />
            <Route path="/notes" element={<HomePage page="notes" />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProviders>
    </MaintenanceGate>
  )
}

export default App
