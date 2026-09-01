import { NextResponse } from 'next/server'
import { readDb, updateDb } from '../_lib/db'
import { requireUser } from '../_lib/auth'
import { guardMutation, jsonError } from '../_lib/http'

export async function GET() {
  const db = await readDb()
  return NextResponse.json(db.config ?? null)
}

export async function PUT(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { response } = await requireUser(request)
  if (response) return response

  let incoming
  try {
    incoming = await request.json()
  } catch {
    return jsonError('Expected a config object.')
  }
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return jsonError('Expected a config object.')
  }
  delete incoming.admin
  await updateDb(async (next) => {
    next.config = incoming
  })
  return NextResponse.json({ ok: true })
}
