/**
 * Admin session bookkeeping for the browser.
 *
 * Authentication itself happens on the server: /api/auth/login checks a bcrypt
 * hash and issues an httpOnly cookie the page cannot read. Nothing here proves
 * anything — these helpers only remember that a sign-in happened so the panel
 * can restore itself across a refresh, and the server re-checks the cookie on
 * every request regardless.
 *
 * There used to be a browser-side password check here, comparing a SHA-256
 * hash shipped in the bundle. It was unreachable once the API landed, and a
 * credential hash in downloadable code is worth nothing but risk, so it is
 * gone.
 */

const SESSION_KEY = 'igloo.adminSession.v1'
const SESSION_HOURS = 2

/* sessionStorage: clears when the tab closes. */

export function readSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { expires } = JSON.parse(raw)
    if (!expires || Date.now() > expires) {
      window.sessionStorage.removeItem(SESSION_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

export function startSession() {
  try {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ expires: Date.now() + SESSION_HOURS * 3600 * 1000 }),
    )
  } catch {
    /* session just won't persist across a refresh */
  }
}

export function endSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* nothing to clear */
  }
}
