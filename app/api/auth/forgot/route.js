import { NextResponse } from 'next/server'
import { makeResetToken, normaliseEmail, seedAdmin } from '../../_lib/auth'
import { readDb, updateDb } from '../../_lib/db'
import { guardMutation, rateLimit, requestOrigin } from '../../_lib/http'
import { sendResetEmail } from '../../_lib/mailer'

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const limited = rateLimit(
    request,
    'forgot',
    5,
    60 * 60 * 1000,
    'Too many reset requests. Try again later.',
  )
  if (limited) return limited

  await seedAdmin()
  const body = await request.json().catch(() => ({}))
  const email = normaliseEmail(body.email)
  const db = await readDb()
  const user = db.users.find((candidate) => candidate.email === email)

  if (user) {
    const { token, tokenHash } = makeResetToken()
    await updateDb(async (next) => {
      next.resetTokens = next.resetTokens.filter((item) => item.userId !== user.id)
      next.resetTokens.push({
        userId: user.id,
        tokenHash,
        expires: Date.now() + 30 * 60 * 1000,
      })
    })
    await sendResetEmail(user.email, `${requestOrigin(request)}/#admin-reset=${token}`)
  }

  return NextResponse.json({
    ok: true,
    message: 'If that email has an admin account, a reset link is on its way.',
  })
}
