import { NextResponse } from 'next/server'
import {
  checkPassword,
  normaliseEmail,
  requireUser,
  withSession,
} from '../../_lib/auth'
import { readDb, updateDb } from '../../_lib/db'
import { guardMutation, jsonError } from '../../_lib/http'

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { user, response } = await requireUser(request)
  if (response) return response
  const body = await request.json().catch(() => ({}))
  const password = String(body.password || '')
  const email = normaliseEmail(body.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return jsonError('That email address looks wrong.')
  }

  const db = await readDb()
  const current = db.users.find((candidate) => candidate.id === user.id)
  if (!current || !(await checkPassword(password, current.passwordHash))) {
    return jsonError('Your password is incorrect.', 401)
  }
  if (db.users.some((candidate) => candidate.email === email && candidate.id !== user.id)) {
    return jsonError('Another account already uses that email.', 409)
  }

  const next = await updateDb(async (draft) => {
    const target = draft.users.find((candidate) => candidate.id === user.id)
    target.email = email
    target.sessionVersion = (target.sessionVersion ?? 0) + 1
  })
  return withSession(
    NextResponse.json({ email }),
    next.users.find((candidate) => candidate.id === user.id),
  )
}
