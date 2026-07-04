import { useEffect, useMemo, useState } from 'react'
import {
  getCurrentUser,
  loginWithEmail,
  loginWithGoogleCredential,
  logoutSession,
  requestPasswordReset,
  resendEmailOtp,
  signupWithEmail,
  submitPasswordReset,
  verifyEmailOtp,
} from '../services/authAdapter.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      try {
        const result = await getCurrentUser()
        if (isMounted) setUser(result.user)
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsCheckingSession(false)
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isCheckingSession,
    async signup(values) {
      return signupWithEmail(values)
    },
    async verifyEmail(values) {
      return verifyEmailOtp(values)
    },
    async resendOtp(values) {
      return resendEmailOtp(values)
    },
    async login(values) {
      const result = await loginWithEmail(values)
      setUser(result.user)
      return result
    },
    async loginWithGoogle(credential) {
      const result = await loginWithGoogleCredential(credential)
      setUser(result.user)
      return result
    },
    async logout() {
      try {
        await logoutSession()
      } finally {
        setUser(null)
      }
    },
    async forgotPassword(values) {
      return requestPasswordReset(values)
    },
    async resetPassword(values) {
      const result = await submitPasswordReset(values)
      setUser(null)
      return result
    },
  }), [isCheckingSession, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
