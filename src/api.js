/**
 * Talks to the API server.
 *
 * If VITE_API_URL is not set, the site runs in LOCAL PREVIEW mode: settings
 * come from src/config.js, edits live only in your browser, and uploads are
 * unavailable. Set VITE_API_URL in a .env file to switch on the real backend.
 */

const BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '')

export const hasBackend = Boolean(BASE)

/** Uploads come back as /uploads/x.jpg — relative to the API, not the site. */
export const mediaUrl = (url) =>
  url && url.startsWith('/uploads/') ? `${BASE}${url}` : url

async function request(path, { method = 'GET', body, form } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include', // session cookie
    headers: form ? undefined : body ? { 'Content-Type': 'application/json' } : undefined,
    body: form ?? (body ? JSON.stringify(body) : undefined),
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body is fine */
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  getConfig: () => request('/api/config'),
  saveConfig: (config) => request('/api/config', { method: 'PUT', body: config }),

  me: () => request('/api/auth/me'),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  forgot: (email) =>
    request('/api/auth/forgot', { method: 'POST', body: { email } }),
  reset: (token, password) =>
    request('/api/auth/reset', { method: 'POST', body: { token, password } }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
  changeEmail: (email, password) =>
    request('/api/auth/change-email', { method: 'POST', body: { email, password } }),

  async upload(file) {
    const form = new FormData()
    form.append('file', file)
    const data = await request('/api/media', { method: 'POST', form })
    return { ...data, url: mediaUrl(data.url) }
  },
}
