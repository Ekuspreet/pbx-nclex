import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { GuestRoute, ProtectedRoute } from './auth/AuthRoutes.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/auth/AuthPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx'
import HomePage from './pages/HomePage.jsx'
import TestPage from './pages/TestPage.jsx'
import TestResultPage from './pages/TestResultPage.jsx'

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-base-100 p-6" data-theme="nord">
      <h1 className="text-2xl font-bold">PAGE NOT FOUND</h1>
      <p className="mt-2">The requested page does not exist.</p>
      <a className="btn btn-primary mt-4" href="/">Return home</a>
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
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage page="dashboard" />} />
            <Route path="/tests/create" element={<HomePage page="createTest" />} />
            <Route path="/tests" element={<HomePage page="tests" />} />
            <Route path="/tests/results" element={<HomePage page="tests" />} />
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
