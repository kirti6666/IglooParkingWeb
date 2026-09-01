import express from 'express'
import rateLimit from 'express-rate-limit'
import crypto from 'node:crypto'
import { readDb, updateDb } from '../db.js'
import {
  checkPassword,
  clearSession,
  hashPassword,
  hashToken,
  issueSession,
  makeResetToken,
  requestOrigin,
  requireAuth,
} from '../auth.js'
import { sendResetEmail } from '../mailer.js'

const router = express.Router()

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
})

const forgotLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset requests. Try again later.' },
})

const MIN_PASSWORD = 10

const normalise = (email) => String(email || '').trim().toLowerCase()

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters.`
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.'
  }
  return null
}

/* ---------------- who am I ---------------- */

router.get('/me', requireAuth, (req, res) => res.json({ email: req.user.email }))

/* ---------------- sign in / out ---------------- */

router.post('/login', loginLimit, async (req, res) => {
  const email = normalise(req.body?.email)
  const password = String(req.body?.password || '')

  const db = await readDb()
  const user = db.users.find((u) => u.email === email)

  // Always run a comparison so a missing account and a wrong password take
  // the same time — otherwise timing reveals which emails exist.
  const hash = user?.passwordHash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu'
  const ok = await checkPassword(password, hash)

  if (!user || !ok) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  issueSession(res, user)
  return res.json({ email: user.email })
})

router.post('/logout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

/* ---------------- forgotten password ---------------- */

router.post('/forgot', forgotLimit, async (req, res) => {
  const email = normalise(req.body?.email)

  const db = await readDb()
  const user = db.users.find((u) => u.email === email)

  if (user) {
    const { token, tokenHash } = makeResetToken()
    await updateDb(async (next) => {
      // one live token per user
      next.resetTokens = next.resetTokens.filter((t) => t.userId !== user.id)
      next.resetTokens.push({
        userId: user.id,
        tokenHash,
        expires: Date.now() + 30 * 60 * 1000,
      })
    })

    const base = requestOrigin(req) || process.env.FRONTEND_ORIGIN || process.env.RENDER_EXTERNAL_URL || ''
    await sendResetEmail(user.email, `${base}/#admin-reset=${token}`)
  }

  // Same reply either way, so this can't be used to discover which
  // email addresses have an account.
  return res.json({
    ok: true,
    message: 'If that email has an admin account, a reset link is on its way.',
  })
})

router.post('/reset', async (req, res) => {
  const token = String(req.body?.token || '')
  const password = String(req.body?.password || '')

  const problem = validatePassword(password)
  if (problem) return res.status(400).json({ error: problem })

  const db = await readDb()
  const tokenHash = hashToken(token)
  const record = db.resetTokens.find((t) => t.tokenHash === tokenHash)

  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ error: 'That reset link is invalid or expired.' })
  }

  const passwordHash = await hashPassword(password)
  await updateDb(async (next) => {
    const user = next.users.find((u) => u.id === record.userId)
    if (user) {
      user.passwordHash = passwordHash
      user.sessionVersion = (user.sessionVersion ?? 0) + 1
    }
    // single use
    next.resetTokens = next.resetTokens.filter((t) => t.tokenHash !== tokenHash)
  })

  return res.json({ ok: true })
})

/* ---------------- change credentials while signed in ---------------- */

router.post('/change-password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')

  const problem = validatePassword(newPassword)
  if (problem) return res.status(400).json({ error: problem })

  const db = await readDb()
  const user = db.users.find((u) => u.id === req.user.sub)
  if (!user || !(await checkPassword(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: 'Your current password is incorrect.' })
  }

  const passwordHash = await hashPassword(newPassword)
  const next = await updateDb(async (next) => {
    const target = next.users.find((u) => u.id === user.id)
    target.passwordHash = passwordHash
    target.sessionVersion = (target.sessionVersion ?? 0) + 1
  })

  issueSession(res, next.users.find((candidate) => candidate.id === user.id))

  return res.json({ ok: true })
})

router.post('/change-email', requireAuth, async (req, res) => {
  const password = String(req.body?.password || '')
  const email = normalise(req.body?.email)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'That email address looks wrong.' })
  }

  const db = await readDb()
  const user = db.users.find((u) => u.id === req.user.sub)
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Your password is incorrect.' })
  }
  if (db.users.some((u) => u.email === email && u.id !== user.id)) {
    return res.status(409).json({ error: 'Another account already uses that email.' })
  }

  const next = await updateDb(async (next) => {
    const target = next.users.find((u) => u.id === user.id)
    target.email = email
    target.sessionVersion = (target.sessionVersion ?? 0) + 1
  })

  issueSession(res, next.users.find((candidate) => candidate.id === user.id))
  return res.json({ email })
})

/* ---------------- admin account setup ---------------- */

const line = '─'.repeat(64)

/**
 * Creates the admin account.
 *
 * Normally this only runs when no account exists yet, so a later edit to
 * ADMIN_PASSWORD doesn't silently overwrite a password you changed in the
 * admin panel. Pass { force: true } (via `npm run reset-admin`) to overwrite
 * deliberately — that's the escape hatch when you're locked out.
 */
export async function seedAdmin({ force = false } = {}) {
  const db = await readDb()
  const email = normalise(process.env.ADMIN_EMAIL)
  const password = process.env.ADMIN_PASSWORD
  const credentialsVersion = String(process.env.ADMIN_CREDENTIALS_VERSION || '').trim()

  if (db.users.length > 0 && !force) {
    const existingUser = db.users[0]

    // A version bump deliberately rotates the persisted production credentials
    // once. Keeping the applied version in the database prevents later restarts
    // from undoing password/email changes made through the admin panel.
    if (credentialsVersion && existingUser.credentialsVersion !== credentialsVersion) {
      if (!email || !password) {
        console.warn(
          '⚠  ADMIN_CREDENTIALS_VERSION changed, but ADMIN_EMAIL or ADMIN_PASSWORD is missing.',
        )
        console.warn('   Existing admin credentials were left unchanged.')
        return
      }

      const passwordError = validatePassword(password)
      if (passwordError) {
        console.warn(`⚠  Admin credentials were not rotated: ${passwordError}`)
        return
      }

      const passwordHash = await hashPassword(password)
      await updateDb(async (next) => {
        const target = next.users[0]
        target.email = email
        target.passwordHash = passwordHash
        target.sessionVersion = (target.sessionVersion ?? 0) + 1
        target.credentialsVersion = credentialsVersion
        next.resetTokens = []
      })
      console.log(`✓ Admin credentials rotated for ${email}`)
      return
    }

    const existing = db.users.map((u) => u.email).join(', ')
    console.log(`✓ Admin account: ${existing}`)

    // The single most confusing failure: editing .env after first boot and
    // wondering why the new credentials don't work. Say so out loud.
    if (email && email !== db.users[0].email) {
      console.warn(`\n${line}`)
      console.warn(`⚠  ADMIN_EMAIL in .env is "${email}"`)
      console.warn(`   but the existing account is  "${db.users[0].email}"`)
      console.warn('   Sign in with the EXISTING one. .env is only read when')
      console.warn('   the account is first created.')
      console.warn('   To overwrite it with the .env values:  npm run reset-admin')
      console.warn(`${line}\n`)
    }
    return
  }

  const problem = !email || !password
    ? 'set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env'
    : validatePassword(password)

  if (problem) {
    console.error(`\n${line}`)
    console.error(`✗  NO ADMIN ACCOUNT — you will not be able to sign in.`)
    console.error(`   ${problem}`)
    console.error('   Fix server/.env, then restart.')
    console.error(`${line}\n`)
    return
  }

  const passwordHash = await hashPassword(password)
  await updateDb(async (next) => {
    if (force) next.users = []
    next.users.push({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      sessionVersion: 0,
      credentialsVersion: credentialsVersion || undefined,
      createdAt: new Date().toISOString(),
    })
    if (force) next.resetTokens = []
  })

  console.log(`\n${line}`)
  console.log(`✓  Admin account ${force ? 'RESET' : 'created'}`)
  console.log(`   Sign in at ${process.env.FRONTEND_ORIGIN || ''}/#admin`)
  console.log(`   Email: ${email}`)
  console.log(`${line}\n`)
}

export default router
