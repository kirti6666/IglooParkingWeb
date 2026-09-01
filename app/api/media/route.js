import crypto from 'node:crypto'
import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { NextResponse } from 'next/server'
import { requireUser } from '../_lib/auth'
import { ensureStorage, UPLOAD_DIR } from '../_lib/db'
import { guardMutation, jsonError } from '../_lib/http'

export const runtime = 'nodejs'

const ALLOWED = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}
const MAX_BYTES = 25 * 1024 * 1024

function validMagic(buffer, ext) {
  const head = buffer.subarray(0, 16)
  const hex = head.toString('hex')
  const ascii = head.toString('latin1')
  if (ext === '.png') return hex.startsWith('89504e470d0a1a0a')
  if (ext === '.jpg' || ext === '.jpeg') return hex.startsWith('ffd8ff')
  if (ext === '.webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP'
  if (ext === '.mp4') return ascii.slice(4, 8) === 'ftyp'
  if (ext === '.webm') return hex.startsWith('1a45dfa3')
  return false
}

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { response } = await requireUser(request)
  if (response) return response

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return jsonError('No file received.')
  if (file.size > MAX_BYTES) return jsonError('That file is larger than 25 MB.')

  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED[ext]) return jsonError('Only JPG, PNG, WebP, MP4 and WebM files are allowed.')
  if (file.type !== ALLOWED[ext]) return jsonError("That file's type doesn't match its extension.")

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validMagic(buffer, ext)) return jsonError("That file isn't a valid image or video.")

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
  await ensureStorage()
  await writeFile(path.join(UPLOAD_DIR, filename), buffer)
  return NextResponse.json(
    { url: `/uploads/${filename}`, filename, bytes: file.size },
    { status: 201 },
  )
}
