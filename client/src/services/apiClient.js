const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

let refreshPromise = null

export class ApiError extends Error {
  constructor(message, response, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = response.status
    this.payload = payload
    this.details = payload?.details || []
  }
}

async function parseResponse(response) {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

async function rawRequest(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  const config = {
    method: options.method || 'GET',
    credentials: 'include',
    headers,
  }

  if (options.body !== undefined) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config)
  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(payload?.message || 'Request failed.', response, payload)
  }

  return payload
}

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST' })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function apiRequest(path, options = {}) {
  try {
    return await rawRequest(path, options)
  } catch (error) {
    const shouldRefresh = error instanceof ApiError &&
      error.status === 401 &&
      !options.skipAuthRefresh &&
      path !== '/auth/refresh'

    if (!shouldRefresh) {
      throw error
    }

    await refreshSession()
    return rawRequest(path, { ...options, skipAuthRefresh: true })
  }
}

export function getApiErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}
