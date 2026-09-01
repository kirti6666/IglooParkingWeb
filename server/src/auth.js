/**
 * Password hashing, session cookies and the auth middleware.
 *
 * Passwords are hashed with bcrypt (cost 12) and never stored or logged in
 * plaintext. Sessions are JWTs delivered in an httpOnly cookie, so page
 * JavaScript — and therefore any XSS — cannot read the token.
 */
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

const COOKIE = 'igloo_session'
const BCRYPT_ROUNDS = 12
const SESSION_HOURS = 8

function cookieOptions() {
  const production = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    // Production serves the site and API from one origin, so Lax provides
    // strong CSRF defaults without relying on third-party cookie support.
    secure: production,
    sameSite: 'lax',
    path: '/',
  }
}

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS)
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash)

/** Reset tokens are random and stored only as a hash — a leaked database
 *  still doesn't let anyone reset a password. */
export function makeResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  return { token, tokenHash }
}

export const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex')

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, email: user.email }, secret(), {
    expiresIn: `${SESSION_HOURS}h`,
  })
  res.cookie(COOKIE, token, {
    ...cookieOptions(),
    maxAge: SESSION_HOURS * 3600 * 1000,
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE, cookieOptions())
}

export function currentUser(req) {
  const token = req.cookies?.[COOKIE]
  if (!token) return null
  try {
    return jwt.verify(token, secret())
  } catch {
    return null
  }
}

export function requireAuth(req, res, next) {
  const user = currentUser(req)
  if (!user) return res.status(401).json({ error: 'Not signed in.' })
  req.user = user
  return next()
}

/** Resolve the public request origin without trusting an arbitrary Origin
 * header. Render supplies the forwarded protocol and the public Host header. */
export function requestOrigin(req) {
  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .split(',')[0]
    .trim()
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
  return host ? `${protocol}://${host}` : ''
}

/**
 * Cookie-based auth needs CSRF protection. Every mutating request must come
 * from the exact public origin (or the configured local frontend origin).
 */
export function sameOriginOnly(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const allowed = [
    requestOrigin(req),
    process.env.FRONTEND_ORIGIN,
    process.env.RENDER_EXTERNAL_URL,
  ].filter(Boolean)
  const source = req.headers.origin || req.headers.referer || ''
  let sourceOrigin = ''
  try {
    sourceOrigin = new URL(source).origin
  } catch {
    // Missing or malformed browser origins fail closed.
  }
  const allowedOrigins = allowed.flatMap((value) => {
    try {
      return [new URL(value).origin]
    } catch {
      return []
    }
  })
  if (!sourceOrigin || !allowedOrigins.includes(sourceOrigin)) {
    return res.status(403).json({ error: 'Cross-origin request refused.' })
  }
  return next()
}

function secret() {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET is missing or too short (need 32+ characters).')
  }
  return value
}
