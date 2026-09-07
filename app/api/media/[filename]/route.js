import { del } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireUser } from '../../_lib/auth'
import { guardMutation, jsonError } from '../../_lib/http'

/** Exactly the shape POST /api/media generates: `<epoch>-<16 hex><ext>`.
 *  Matching the generator rather than merely stripping directories means no
 *  traversal, encoded separator, or unrelated blob key can reach `del`. */
const MANAGED_NAME = /^\d{10,17}-[0-9a-f]{16}\.(?:jpe?g|png|webp|mp4|webm)$/i

export async function DELETE(request, context) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { response } = await requireUser(request)
  if (response) return response

  const { filename } = await context.params
  const name = String(filename || '')
  if (!MANAGED_NAME.test(name)) return jsonError('Not a managed file.')

  await del(`igloo-media/${name}`).catch(() => {})
  return NextResponse.json({ ok: true })
}
