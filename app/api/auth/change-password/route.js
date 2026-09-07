import { NextResponse } from 'next/server'
import {
  checkPassword,
  hashPassword,
  requireUser,
  validatePassword,
  withSession,
} from '../../_lib/auth'
import { readDb, updateDb } from '../../_lib/db'
import { guardMutation, jsonError, rateLimit, readJson } from '../../_lib/http'

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { user, response } = await requireUser(request)
  if (response) return response
  const limited = rateLimit(
    request,
    'change-password',
    10,
    15 * 60 * 1000,
    'Too many attempts. Try again in 15 minutes.',
  )
  if (limited) return limited

  const { data: body, error } = await readJson(request, 8 * 1024)
  if (error) return error
  const currentPassword = String(body.currentPassword || '')
  const newPassword = String(body.newPassword || '')
  const problem = validatePassword(newPassword)
  if (problem) return jsonError(problem)

  const db = await readDb()
  const current = db.users.find((candidate) => candidate.id === user.id)
  if (!current || !(await checkPassword(currentPassword, current.passwordHash))) {
    return jsonError('Your current password is incorrect.', 401)
  }

  const passwordHash = await hashPassword(newPassword)
  const next = await updateDb(async (draft) => {
    const target = draft.users.find((candidate) => candidate.id === user.id)
    target.passwordHash = passwordHash
    target.sessionVersion = (target.sessionVersion ?? 0) + 1
  })
  return withSession(
    NextResponse.json({ ok: true }),
    next.users.find((candidate) => candidate.id === user.id),
  )
}
