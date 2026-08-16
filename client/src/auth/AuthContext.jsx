import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentUser,
  loginWithEmail,
  loginWithGoogleCredential,
  logoutSession,
  requestPasswordReset,
  resendEmailOtp,
  signupWithEmail,
  submitPasswordReset,
  setCurrentUserPassword,
  updateCurrentUser,
  verifyEmailOtp,
} from '../services/authAdapter.js'
import { AuthContext } from './authContext.js'
import { queryKeys } from '../services/queryKeys.js'

const PASSWORD_PROMPT_DISMISSED_USER_KEY = 'passwordPromptDismissedUser'
const FREE_MONTH_PROMPT_DISMISSED_USER_KEY = 'freeMonthPromptDismissedUser'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [passwordPromptDismissed, setPasswordPromptDismissed] = useState(false)
  const [freeMonthPromptDismissed, setFreeMonthPromptDismissed] = useState(false)
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: getCurrentUser,
    retry: false,
  })
  const signupMutation = useMutation({ mutationFn: signupWithEmail })
  const verifyEmailMutation = useMutation({ mutationFn: verifyEmailOtp })
  const resendOtpMutation = useMutation({ mutationFn: resendEmailOtp })
  const loginMutation = useMutation({ mutationFn: loginWithEmail })
  const googleLoginMutation = useMutation({ mutationFn: loginWithGoogleCredential })
  const updateProfileMutation = useMutation({ mutationFn: updateCurrentUser })
  const setPasswordMutation = useMutation({ mutationFn: setCurrentUserPassword })
  const logoutMutation = useMutation({ mutationFn: logoutSession })
  const forgotPasswordMutation = useMutation({ mutationFn: requestPasswordReset })
  const resetPasswordMutation = useMutation({ mutationFn: submitPasswordReset })
  const user = sessionQuery.data?.user || null
  const isCheckingSession = sessionQuery.isPending
  const promptUserKey = user ? String(user.id || user.email || '') : ''
  const passwordPromptDismissedForUser = passwordPromptDismissed || (
    promptUserKey && window.sessionStorage.getItem(PASSWORD_PROMPT_DISMISSED_USER_KEY) === promptUserKey
  )
  const freeMonthPromptDismissedForUser = freeMonthPromptDismissed || (
    promptUserKey && window.sessionStorage.getItem(FREE_MONTH_PROMPT_DISMISSED_USER_KEY) === promptUserKey
  )

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.session, refetchType: 'none' })
    const result = await queryClient.fetchQuery({ queryKey: queryKeys.session, queryFn: getCurrentUser, staleTime: 0 })
    return result
  }, [queryClient])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isCheckingSession,
    shouldPromptForPassword: Boolean(user && !user.hasPassword && !passwordPromptDismissedForUser),
    dismissPasswordPrompt() {
      if (promptUserKey) window.sessionStorage.setItem(PASSWORD_PROMPT_DISMISSED_USER_KEY, promptUserKey)
      setPasswordPromptDismissed(true)
    },
    shouldPromptForFreeMonth: Boolean(user && user.bankedFreeMonths > 0 && !freeMonthPromptDismissedForUser),
    dismissFreeMonthPrompt() {
      if (promptUserKey) window.sessionStorage.setItem(FREE_MONTH_PROMPT_DISMISSED_USER_KEY, promptUserKey)
      setFreeMonthPromptDismissed(true)
    },
    async signup(values) {
      return signupMutation.mutateAsync(values)
    },
    async verifyEmail(values) {
      return verifyEmailMutation.mutateAsync(values)
    },
    async resendOtp(values) {
      return resendOtpMutation.mutateAsync(values)
    },
    async login(values) {
      await loginMutation.mutateAsync(values)
      window.sessionStorage.removeItem(PASSWORD_PROMPT_DISMISSED_USER_KEY)
      setPasswordPromptDismissed(false)
      return refreshUser()
    },
    async updateProfile(values) {
      await updateProfileMutation.mutateAsync(values)
      return refreshUser()
    },
    async setPassword(values) {
      const response = await setPasswordMutation.mutateAsync(values)
      const result = await refreshUser()
      setPasswordPromptDismissed(true)
      return { ...response, user: result.user }
    },
    async refreshUser() {
      return refreshUser()
    },
    async loginWithGoogle(credential) {
      await googleLoginMutation.mutateAsync(credential)
      window.sessionStorage.removeItem(PASSWORD_PROMPT_DISMISSED_USER_KEY)
      setPasswordPromptDismissed(false)
      return refreshUser()
    },
    async logout() {
      try {
        await logoutMutation.mutateAsync()
      } finally {
        window.sessionStorage.removeItem(PASSWORD_PROMPT_DISMISSED_USER_KEY)
        setPasswordPromptDismissed(false)
        await queryClient.cancelQueries({ queryKey: queryKeys.session })
        queryClient.setQueryData(queryKeys.session, { user: null })
        queryClient.removeQueries({ predicate: (query) => !['maintenance', 'plans', 'session', 'admin'].includes(query.queryKey[0]) })
      }
    },
    async forgotPassword(values) {
      return forgotPasswordMutation.mutateAsync(values)
    },
    async resetPassword(values) {
      const result = await resetPasswordMutation.mutateAsync(values)
      queryClient.setQueryData(queryKeys.session, { user: null })
      return result
    },
  }), [forgotPasswordMutation, freeMonthPromptDismissedForUser, googleLoginMutation, isCheckingSession, loginMutation, logoutMutation, passwordPromptDismissedForUser, promptUserKey, queryClient, refreshUser, resendOtpMutation, resetPasswordMutation, setPasswordMutation, signupMutation, updateProfileMutation, user, verifyEmailMutation])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
