import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth.js'

function SessionLoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-base-100" data-theme="nord">
      <span className="loading loading-spinner loading-lg text-primary" />
    </main>
  )
}

export function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isCheckingSession) return <SessionLoadingPage />
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}

export function GuestRoute() {
  const auth = useAuth()

  if (auth.isCheckingSession) return <SessionLoadingPage />
  if (auth.isAuthenticated) return <Navigate to="/home" replace />

  return <Outlet />
}
