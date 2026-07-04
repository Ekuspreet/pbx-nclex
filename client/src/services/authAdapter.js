import { apiRequest } from './apiClient.js'

export function getCurrentUser() {
  return apiRequest('/auth/me')
}

export function signupWithEmail(values) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: values,
    skipAuthRefresh: true,
  })
}

export function verifyEmailOtp(values) {
  return apiRequest('/auth/verify-email', {
    method: 'POST',
    body: values,
    skipAuthRefresh: true,
  })
}

export function resendEmailOtp(values) {
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: values,
    skipAuthRefresh: true,
  })
}

export function loginWithEmail(values) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: values,
    skipAuthRefresh: true,
  })
}

export function loginWithGoogleCredential(credential) {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: { credential },
    skipAuthRefresh: true,
  })
}

export function logoutSession() {
  return apiRequest('/auth/logout', {
    method: 'POST',
    skipAuthRefresh: true,
  })
}

export function logoutAllSessions() {
  return apiRequest('/auth/logout-all', {
    method: 'POST',
    skipAuthRefresh: true,
  })
}

export function requestPasswordReset(values) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: values,
    skipAuthRefresh: true,
  })
}

export function submitPasswordReset(values) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: values,
    skipAuthRefresh: true,
  })
}
