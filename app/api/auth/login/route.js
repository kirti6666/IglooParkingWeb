import { NextResponse } from 'next/server'
import { checkPassword, normaliseEmail, seedAdmin, withSession } from '../../_lib/auth'
import { readDb } from '../../_lib/db'
import { guardMutation, jsonError, rateLimit } from '../../_lib/http'

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const limited = rateLimit(
    request,
    'login',
    10,
    15 * 60 * 1000,
    'Too many sign-in attempts. Try again in 15 minutes.',
  )
  if (limited) return limited

  try {
    await seedAdmin()
  } catch (error) {
    console.error('Admin initialization failed:', error)
    return jsonError(
      'Admin storage could not be initialized. Check /api/health and the Vercel function logs.',
      500,
    )
  }
  const body = await request.json().catch(() => ({}))
  const email = normaliseEmail(body.email)
  const password = String(body.password || '')
  const db = await readDb()
  const user = db.users.find((candidate) => candidate.email === email)
  const hash = user?.passwordHash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu'
  const valid = await checkPassword(password, hash)
  if (!user || !valid) return jsonError('Incorrect email or password.', 401)

  return withSession(NextResponse.json({ email: user.email }), user)
}
