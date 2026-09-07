import { NextResponse } from 'next/server'

/** Per-instance rate-limit buckets.
 *
 *  Serverless instances don't share memory, so this bounds abuse from a single
 *  instance rather than globally — a determined attacker spread across many
 *  cold starts gets proportionally more attempts. It is a speed bump in front
 *  of bcrypt, not a substitute for a shared store; see the README. */
const buckets = new Map()
const MAX_BUCKETS = 5000

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

export function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  )
}

/** Drops buckets whose window has already closed. Without this the map grows
 *  once per distinct IP for the life of the instance. */
function sweep(now) {
  for (const [id, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(id)
  }
}

/** Rate limit against an arbitrary identity — an account email, say, rather
 *  than an IP. Kept deliberately generous where the identity is attacker-chosen,
 *  since a tight budget there lets anyone lock a real admin out. */
export function rateLimitBy(identity, key, limit, windowMs, message) {
  const now = Date.now()
  if (buckets.size >= MAX_BUCKETS) sweep(now)
  // Still full of live windows: refuse rather than grow without bound.
  if (buckets.size >= MAX_BUCKETS) {
    return jsonError('The server is busy. Please try again in a moment.', 429)
  }

  const id = `${key}:${identity}`
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

export function rateLimit(request, key, limit, windowMs, message) {
  return rateLimitBy(clientIp(request), key, limit, windowMs, message)
}

/** Reads a JSON body with a hard size ceiling.
 *
 *  `request.json()` will happily buffer whatever it is sent, so an authenticated
 *  session could push an arbitrarily large document into memory (and, for the
 *  config endpoint, into storage). Returns `{ data }` or `{ error }` — never
 *  throws. */
export async function readJson(request, maxBytes = 64 * 1024) {
  const declared = Number(request.headers.get('content-length') || 0)
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { error: jsonError('That request body is too large.', 413) }
  }

  let text
  try {
    text = await request.text()
  } catch {
    return { error: jsonError('Could not read the request body.') }
  }
  // content-length is a claim; the body is the fact.
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    return { error: jsonError('That request body is too large.', 413) }
  }

  try {
    return { data: text ? JSON.parse(text) : {} }
  } catch {
    return { error: jsonError('Expected a JSON body.') }
  }
}
