import { NextResponse } from 'next/server'
import { clearSession } from '../../_lib/auth'
import { guardMutation } from '../../_lib/http'

export function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  return clearSession(NextResponse.json({ ok: true }))
}
