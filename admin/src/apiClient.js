const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, response, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = response.status
    this.payload = payload
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

export async function apiRequest(path, options = {}) {
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
