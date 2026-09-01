import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { NextResponse } from 'next/server'
import { ensureStorage, UPLOAD_DIR } from '../../../_lib/db'

export const runtime = 'nodejs'

const TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

export async function GET(request, context) {
  const { filename } = await context.params
  const name = path.basename(filename)
  const type = TYPES[path.extname(name).toLowerCase()]
  if (!type) return new NextResponse(null, { status: 404 })
  try {
    await ensureStorage()
    const file = await readFile(path.join(UPLOAD_DIR, name))
    return new NextResponse(file, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=604800',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
