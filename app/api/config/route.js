import { NextResponse } from 'next/server'
import { readDb, updateDb } from '../_lib/db'
import { requireUser } from '../_lib/auth'
import { guardMutation, jsonError, rateLimit, readJson } from '../_lib/http'
import { sanitiseConfig } from '../_lib/config-schema'

/** Comfortably above a full config with long captions, far below anything
 *  that would be worth buffering into memory and writing to storage. */
const MAX_CONFIG_BYTES = 128 * 1024

export async function GET() {
  const db = await readDb()
  return NextResponse.json(db.config ?? null)
}

export async function PUT(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { response } = await requireUser(request)
  if (response) return response

  const limited = rateLimit(
    request,
    'config-put',
    60,
    10 * 60 * 1000,
    'Too many publishes in a row. Try again shortly.',
  )
  if (limited) return limited

  const { data: incoming, error } = await readJson(request, MAX_CONFIG_BYTES)
  if (error) return error
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return jsonError('Expected a config object.')
  }

  try {
    const next = await updateDb(async (draft) => {
      draft.config = sanitiseConfig(incoming, draft.config)
    })
    return NextResponse.json({ ok: true, config: next.config })
  } catch (err) {
    console.error('Config publish failed:', err)
    return jsonError(err.message || 'Could not save the configuration.', 503)
  }
}
