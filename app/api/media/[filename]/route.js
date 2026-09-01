import path from 'node:path'
import { unlink } from 'node:fs/promises'
import { NextResponse } from 'next/server'
import { requireUser } from '../../_lib/auth'
import { UPLOAD_DIR } from '../../_lib/db'
import { guardMutation, jsonError } from '../../_lib/http'

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm'])

export async function DELETE(request, context) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { response } = await requireUser(request)
  if (response) return response
  const { filename } = await context.params
  const name = path.basename(filename)
  if (!ALLOWED.has(path.extname(name).toLowerCase())) return jsonError('Not a managed file.')
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {})
  return NextResponse.json({ ok: true })
}
