/**
 * ---------------------------------------------------------------
 * Admin sign-in.
 *
 * READ THIS BEFORE RELYING ON IT.
 *
 * This is a browser-only gate on a static site. There is no server, so the
 * check happens in JavaScript that the visitor has already downloaded. A
 * determined person can read the bundle, see the password hash, and bypass
 * the check with devtools. It is a deterrent — a lock on a garden gate, not
 * a bank vault.
 *
 * Today that is an acceptable trade, because the admin panel publishes
 * nothing: it edits the visitor's own copy of the page and saves to their own
 * browser. The worst a bypass achieves is recolouring the site for themselves.
 *
 * The moment you connect saving to a server or CMS, this is NOT enough. You
 * need the server to verify credentials and issue a session token, and the
 * password must never be checked in client code. See the README.
 *
 * The password is stored as a salted SHA-256 hash so the plaintext isn't
 * sitting in the bundle for a casual reader.
 * ---------------------------------------------------------------
 */

const SALT = 'igloo-parking-admin-v1'
const SESSION_KEY = 'igloo.adminSession.v1'
const SESSION_HOURS = 2

/** Hashes credentials with Web Crypto (available on https:// and localhost). */
export async function hashCredentials(username, password) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    const err = new Error('insecure-context')
    err.code = 'insecure-context'
    throw err
  }
  const input = `${SALT}:${String(username).trim().toLowerCase()}:${password}`
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time-ish comparison, so timing doesn't leak the hash. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyCredentials(username, password, admin) {
  const hash = await hashCredentials(username, password)
  const userMatches =
    String(username).trim().toLowerCase() ===
    String(admin.username).trim().toLowerCase()
  return userMatches && safeEqual(hash, admin.passwordHash)
}

/* ---------- session (sessionStorage: clears when the tab closes) ---------- */

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
