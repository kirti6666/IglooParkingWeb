import { NextResponse } from 'next/server'

const buckets = new Map()

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** A blob or encryption failure is a deployment problem, not bad input, and
 *  it otherwise escapes the handler as a bare 500 with no body at all. The
 *  cause goes to the server log (Vercel → the function's logs); the visitor
 *  gets something readable that gives nothing about the deployment away.
 *  `/api/health` reports whether the blob store and JWT_SECRET are set. */
export function storageUnavailable(error, action = 'save that') {
  console.error('[igloo] storage unavailable:', error)
  return jsonError(
    `Sorry — we couldn't ${action} just now. Please try again in a moment.`,
    503,
  )
}

export function requestOrigin(request) {
  const protocol = (request.headers.get('x-forwarded-proto') || new URL(request.url).protocol)
    .split(',')[0]
    .replace(':', '')
    .trim()
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
    .split(',')[0]
    .trim()
  return host ? `${protocol}://${host}` : new URL(request.url).origin
}

export function guardMutation(request) {
  const source = request.headers.get('origin') || request.headers.get('referer') || ''
  let sourceOrigin = ''
  try {
    sourceOrigin = new URL(source).origin
  } catch {
    return jsonError('Cross-origin request refused.', 403)
  }

  const allowed = [
    requestOrigin(request),
    process.env.FRONTEND_ORIGIN,
    process.env.RENDER_EXTERNAL_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => {
      try {
        return [new URL(value).origin]
      } catch {
        return []
      }
    })

  return allowed.includes(sourceOrigin)
    ? null
    : jsonError('Cross-origin request refused.', 403)
}

export function rateLimit(request, key, limit, windowMs, message) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  const id = `${key}:${ip}`
  const now = Date.now()
  const current = buckets.get(id)
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current

  bucket.count += 1
  buckets.set(id, bucket)

  if (bucket.count <= limit) return null
  const response = jsonError(message, 429)
  response.headers.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
  return response
}
