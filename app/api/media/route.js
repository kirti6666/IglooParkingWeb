import crypto from 'node:crypto'
import path from 'node:path'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireUser } from '../_lib/auth'
import { guardMutation, jsonError, rateLimit } from '../_lib/http'

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

/** Browsers don't agree on the type they report for a picked file. Android
 *  pickers and older WebViews often send `application/octet-stream` or nothing
 *  at all, and Windows still produces these legacy aliases — none of which
 *  means the file is bad. */
const MIME_ALIASES = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
  'application/octet-stream': '',
  'binary/octet-stream': '',
}

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

  const limited = rateLimit(
    request,
    'media-upload',
    40,
    60 * 60 * 1000,
    'Too many uploads in a row. Try again shortly.',
  )
  if (limited) return limited

  // Reject on the declared size before `formData()` buffers the whole body
  // into memory. The real size is still checked below — this only saves the
  // function from parsing something it was always going to refuse.
  const declaredBytes = Number(request.headers.get('content-length') || 0)
  if (Number.isFinite(declaredBytes) && declaredBytes > MAX_BYTES * 1.1) {
    return jsonError('That file is larger than 25 MB.', 413)
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return jsonError('No file received.')
  if (file.size > MAX_BYTES) return jsonError('That file is larger than 25 MB.', 413)

  // `file.name` is caller-supplied: take only the extension from it, and build
  // the stored name ourselves so nothing from the client reaches the path.
  const ext = path.extname(path.basename(file.name || '')).toLowerCase()
  const contentType = ALLOWED[ext]
  if (!contentType) return jsonError('Only JPG, PNG, WebP, MP4 and WebM files are allowed.')

  // Reject a declared type that contradicts the extension, but let a missing
  // or generic one through — the magic-number check below is what actually
  // decides, and the stored type comes from the extension either way.
  const declaredType = MIME_ALIASES[file.type?.toLowerCase()] ?? file.type?.toLowerCase() ?? ''
  if (declaredType && declaredType !== contentType) {
    return jsonError("That file's type doesn't match its extension.")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validMagic(buffer, ext)) return jsonError("That file isn't a valid image or video.")

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
  const blob = await put(`igloo-media/${filename}`, buffer, {
    access: 'public',
    addRandomSuffix: false,
    // Pinned to our own allow-list value rather than the client's, so the
    // stored object can never be served as something else.
    contentType,
  })
  return NextResponse.json(
    { url: blob.url, filename, bytes: file.size },
    { status: 201 },
  )
}
