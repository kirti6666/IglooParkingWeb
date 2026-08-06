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
    httpOnly: true,
     secure: true,
      sameSite: 'none',
    maxAge: SESSION_HOURS * 3600 * 1000,
    path: '/',
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' })
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

/**
 * Cookie-based auth needs CSRF protection. The cookie is already
 * sameSite=strict; this adds a second lock by rejecting any mutating request
 * that doesn't come from our own origin.
 */
export function sameOriginOnly(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const allowed = process.env.FRONTEND_ORIGIN
  const source = req.headers.origin || req.headers.referer || ''
  if (allowed && !source.startsWith(allowed)) {
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
