import { NextResponse } from 'next/server'
import { hashPassword, hashToken, validatePassword } from '../../_lib/auth'
import { readDb, updateDb } from '../../_lib/db'
import { guardMutation, jsonError } from '../../_lib/http'

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const body = await request.json().catch(() => ({}))
  const token = String(body.token || '')
  const password = String(body.password || '')
  const problem = validatePassword(password)
  if (problem) return jsonError(problem)

  const db = await readDb()
  const tokenHash = hashToken(token)
  const record = db.resetTokens.find((item) => item.tokenHash === tokenHash)
  if (!record || record.expires < Date.now()) {
    return jsonError('That reset link is invalid or expired.')
  }

  const passwordHash = await hashPassword(password)
  await updateDb(async (next) => {
    const user = next.users.find((candidate) => candidate.id === record.userId)
    if (user) {
      user.passwordHash = passwordHash
      user.sessionVersion = (user.sessionVersion ?? 0) + 1
    }
    next.resetTokens = next.resetTokens.filter((item) => item.tokenHash !== tokenHash)
  })
  return NextResponse.json({ ok: true })
}
