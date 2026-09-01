/**
 * Talks to the API server.
 *
 * Development without VITE_API_URL runs in local-preview mode. Production is
 * intentionally locked to the same-origin API so an old build variable cannot
 * send admin credentials or requests to a stale deployment.
 */

const BASE = import.meta.env.PROD
  ? ''
  : (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '')

export const hasBackend = import.meta.env.PROD || Boolean(BASE)

/** Keep managed upload paths portable in saved configuration. Older local
 *  configs may contain an absolute localhost URL, so migrate those too. */
export function portableMediaUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('/uploads/')) return url

  try {
    const parsed = new URL(url)
    const localHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (localHost && parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    /* A relative/static asset URL is already portable. */
  }

  return url
}

/** Resolve a portable upload path against the API only while rendering. */
export const mediaUrl = (url) => {
  const portable = portableMediaUrl(url)
  return portable?.startsWith('/uploads/') ? `${BASE}${portable}` : portable
}

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

  // A static host can rewrite an unknown /api URL to an empty 200 response.
  // Treat that as a deployment error instead of letting callers crash while
  // reading properties from null.
  if (res.status !== 204 && data === null) {
    const err = new Error(
      'The API backend is unavailable. Deploy this site as a Render web service and try again.',
    )
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

  submitValet: (details) =>
    request('/api/valet', { method: 'POST', body: details }),
  getValetLeads: () => request('/api/valet'),

  async upload(file) {
    const form = new FormData()
    form.append('file', file)
    const data = await request('/api/media', { method: 'POST', form })
    if (!data?.url) {
      throw new Error('The upload server did not return a file URL. Please try again.')
    }
    return { ...data, url: portableMediaUrl(data.url) }
  },
}
