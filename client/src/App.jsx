import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { GuestRoute, ProtectedRoute } from './auth/AuthRoutes.jsx'
import AdminApp, { ADMIN_ROUTE } from './admin/AdminApp.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/auth/AuthPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx'
import HomePage from './pages/HomePage.jsx'
import TestPage from './pages/TestPage.jsx'
import TestResultPage from './pages/TestResultPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import PolicyPage from './pages/PolicyPage.jsx'
import cancellationPolicy from './policy/cancellation.md?raw'
import disclaimerPolicy from './policy/disclaimer.md?raw'
import privacyPolicy from './policy/privacy.md?raw'
import refundPolicy from './policy/return_and_refund.md?raw'
import termsPolicy from './policy/terms_and_conditions.md?raw'

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
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/terms-and-conditions" element={<PolicyPage operatorNotice source={termsPolicy} />} />
          <Route path="/privacy-policy" element={<PolicyPage source={privacyPolicy} />} />
          <Route path="/return-refund-policy" element={<PolicyPage source={refundPolicy} />} />
          <Route path="/cancellation-policy" element={<PolicyPage source={cancellationPolicy} />} />
          <Route path="/disclaimer" element={<PolicyPage source={disclaimerPolicy} />} />
          <Route path={`${ADMIN_ROUTE}/*`} element={<AdminApp />} />
          <Route path="/admin/*" element={<Navigate replace to={ADMIN_ROUTE} />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
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
            <Route path="/tests/:testId/review" element={<TestResultPage />} />
            <Route path="/pricing" element={<HomePage page="pricing" />} />
            <Route path="/payment" element={<HomePage page="payment" />} />
            <Route path="/feedback" element={<HomePage page="feedback" />} />
            <Route path="/highlights" element={<HomePage page="highlights" />} />
            <Route path="/notes" element={<HomePage page="notes" />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}

export default App
