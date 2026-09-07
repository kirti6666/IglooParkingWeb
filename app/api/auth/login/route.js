import { NextResponse } from 'next/server'
import { checkPassword, normaliseEmail, seedAdmin, withSession } from '../../_lib/auth'
import { readDb } from '../../_lib/db'
import { guardMutation, jsonError, rateLimit, rateLimitBy, readJson } from '../../_lib/http'

/**
 * A real bcrypt hash of a value nobody can sign in with.
 *
 * An unknown email must cost the same as a known one. The previous placeholder
 * was not a parseable hash, so bcrypt rejected it in a fraction of a
 * millisecond while a real account took ~350ms — a gap wide enough to
 * enumerate admin emails from response times alone.
 */
const NO_SUCH_USER_HASH =
  '$2a$12$TUErHoLbCPS9OWf.I/OIueuSxVqXHU4enMhLQLxXpKeszTkY6HKD2'

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

  const { data: body, error } = await readJson(request, 8 * 1024)
  if (error) return error
  const email = normaliseEmail(body.email)
  const password = String(body.password || '')

  // A second budget keyed on the account rather than the caller, so one address
  // cannot be ground down from a rotating pool of IPs. Set well above anything
  // a human mistyping their password reaches, because this identity is chosen
  // by the attacker — a tight budget here would be a lockout tool.
  const perAccount = rateLimitBy(
    email,
    'login-account',
    30,
    15 * 60 * 1000,
    'Too many sign-in attempts for that account. Try again in 15 minutes.',
  )
  if (perAccount) return perAccount

  const db = await readDb()
  const user = db.users.find((candidate) => candidate.email === email)
  const valid = await checkPassword(password, user?.passwordHash || NO_SUCH_USER_HASH)
  if (!user || !valid) return jsonError('Incorrect email or password.', 401)

  return withSession(NextResponse.json({ email: user.email }), user)
}
