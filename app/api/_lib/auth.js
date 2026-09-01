import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { readDb, updateDb } from './db.js'

const COOKIE = 'igloo_session'
const BCRYPT_ROUNDS = 12
const SESSION_HOURS = 8
const MIN_PASSWORD = 10

export const normaliseEmail = (email) => String(email || '').trim().toLowerCase()
export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS)
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash)

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters.`
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.'
  }
  return null
}

function secret() {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET is missing or too short (need 32+ characters).')
  }
  return value
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  }
}

export function withSession(response, user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, ver: user.sessionVersion ?? 0 },
    secret(),
    { expiresIn: `${SESSION_HOURS}h` },
  )
  response.cookies.set(COOKIE, token, {
    ...cookieOptions(),
    maxAge: SESSION_HOURS * 3600,
  })
  return response
}

export function clearSession(response) {
  response.cookies.set(COOKIE, '', { ...cookieOptions(), maxAge: 0 })
  return response
}

export async function authenticate(request) {
  const token = request.cookies.get(COOKIE)?.value
  if (!token) return null
  try {
    const session = jwt.verify(token, secret())
    const db = await readDb()
    const user = db.users.find((candidate) => candidate.id === session.sub)
    if (
      !user ||
      user.email !== session.email ||
      (user.sessionVersion ?? 0) !== (session.ver ?? 0)
    ) return null
    return user
  } catch {
    return null
  }
}

export async function requireUser(request) {
  const user = await authenticate(request)
  if (user) return { user, response: null }
  const response = NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  clearSession(response)
  return { user: null, response }
}

export function makeResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  return {
    token,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
  }
}

export const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex')

export async function seedAdmin({ force = false } = {}) {
  const db = await readDb()
  const email = normaliseEmail(process.env.ADMIN_EMAIL)
  const password = process.env.ADMIN_PASSWORD
  const credentialsVersion = String(process.env.ADMIN_CREDENTIALS_VERSION || '').trim()
  const existing = db.users[0]

  if (existing && !force) {
    if (!credentialsVersion || existing.credentialsVersion === credentialsVersion) return existing
    if (!email || !password || validatePassword(password)) return existing

    const passwordHash = await hashPassword(password)
    const next = await updateDb(async (draft) => {
      Object.assign(draft.users[0], {
        email,
        passwordHash,
        sessionVersion: (draft.users[0].sessionVersion ?? 0) + 1,
        credentialsVersion,
      })
      draft.resetTokens = []
    })
    return next.users[0]
  }

  if (!email || !password) return null
  const problem = validatePassword(password)
  if (problem) throw new Error(problem)

  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash: await hashPassword(password),
    sessionVersion: 0,
    credentialsVersion: credentialsVersion || undefined,
    createdAt: new Date().toISOString(),
  }
  await updateDb(async (draft) => {
    if (force) draft.users = []
    draft.users.push(user)
    if (force) draft.resetTokens = []
  })
  return user
}
