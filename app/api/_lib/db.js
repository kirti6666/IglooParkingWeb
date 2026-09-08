import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { del, get, list, put } from '@vercel/blob'
import { defaultConfig } from '../../../src/config.js'

const DATABASE_PREFIX = 'igloo-private/database/'
const LOCAL_DATABASE_PATH = path.join(process.cwd(), '.data', 'igloo-db.json')
const EMPTY = {
  config: null,
  users: [],
  resetTokens: [],
  valetLeads: [],
  hostRegistrations: [],
}

/** Snapshots we keep behind the current one, as a manual recovery window.
 *  Everything older is deleted after each write, so the blob store does not
 *  grow by one file per config save forever. */
const KEEP_SNAPSHOTS = 5
/** Blob `list` pages; the newest snapshot must be found even once thousands
 *  of writes have accumulated, so every page is walked. */
const LIST_PAGE = 1000
const WRITE_ATTEMPTS = 4

const clone = (value) => JSON.parse(JSON.stringify(value))
let writing = Promise.resolve()

function encryptionKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or too short (need 32+ characters).')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

function normalise(value) {
  const db = value && typeof value === 'object' ? value : clone(EMPTY)
  db.users ??= []
  db.resetTokens ??= []
  db.valetLeads ??= []
  db.hostRegistrations ??= []
  if (!db.config) {
    db.config = clone(defaultConfig)
  }
  // GET /api/config is public. Old deployments predate the credential block
  // being removed from the defaults, so strip it on the way out regardless of
  // what an existing snapshot happens to hold.
  if (db.config && typeof db.config === 'object') delete db.config.admin
  return db
}

function useLocalDatabase() {
  return !process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN
}

async function readLocalDatabase() {
  try {
    const payload = await fs.readFile(LOCAL_DATABASE_PATH, 'utf8')
    return normalise(JSON.parse(payload))
  } catch (error) {
    if (error?.code === 'ENOENT') return normalise(null)
    throw error
  }
}

async function writeLocalDatabase(next) {
  await fs.mkdir(path.dirname(LOCAL_DATABASE_PATH), { recursive: true })
  await fs.writeFile(LOCAL_DATABASE_PATH, JSON.stringify(next, null, 2), 'utf8')
}

function encrypt(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ])
  return JSON.stringify({
    version: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: ciphertext.toString('base64'),
  })
}

function decrypt(payload) {
  const envelope = JSON.parse(payload)
  if (envelope.version !== 1) throw new Error('Unsupported database snapshot version.')
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(envelope.iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final(),
  ])
  return JSON.parse(plaintext.toString('utf8'))
}

/** Snapshots are named `<epoch-ms>-<uuid>.enc`. That prefix orders writes more
 *  precisely than the store's own `uploadedAt`, which is assigned on receipt. */
function snapshotOrder(blob) {
  const stamp = Number(blob.pathname.slice(DATABASE_PREFIX.length).split('-')[0])
  return Number.isFinite(stamp) && stamp > 0
    ? stamp
    : new Date(blob.uploadedAt).getTime()
}

/** Every snapshot, newest first.
 *
 *  `list` is paginated and orders by pathname, and pathnames start with the
 *  write timestamp — so the newest snapshot sits at the END of the listing.
 *  Reading only the first page (as this used to) silently returns a stale
 *  snapshot once the prefix passes one page, which reads as the database
 *  rolling back. Every page has to be walked.
 *
 *  Pruning keeps the prefix to a handful of blobs, so this is one call in
 *  practice; a deployment with an existing backlog pages through it until the
 *  first write prunes. */
async function allSnapshots() {
  const found = []
  let cursor
  do {
    // eslint-disable-next-line no-await-in-loop -- pagination is inherently serial
    const page = await list({ prefix: DATABASE_PREFIX, limit: LIST_PAGE, cursor })
    found.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  return found.sort((left, right) => snapshotOrder(right) - snapshotOrder(left))
}

/** Reads the newest snapshot, and reports which one it was so a writer can
 *  detect that someone else moved on underneath it. */
async function readSnapshot() {
  const snapshots = await allSnapshots()
  const latest = snapshots[0]
  if (!latest) return { db: normalise(null), version: null }

  const result = await get(latest.url, { access: 'public', useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { db: normalise(null), version: null }
  }
  const payload = await new Response(result.stream).text()
  return { db: normalise(decrypt(payload)), version: latest.pathname }
}

export async function readDb() {
  if (useLocalDatabase()) return readLocalDatabase()
  const { db } = await readSnapshot()
  return db
}

async function prune(keepPathname) {
  const snapshots = await allSnapshots()
  // Never prune past the snapshot we just wrote, even if a newer one landed.
  const keepIndex = snapshots.findIndex((blob) => blob.pathname === keepPathname)
  const cutoff = Math.max(KEEP_SNAPSHOTS, keepIndex + 1 + KEEP_SNAPSHOTS)
  const stale = snapshots.slice(cutoff).map((blob) => blob.url)

  // The first prune after this change may have a large backlog to clear.
  for (let i = 0; i < stale.length; i += 100) {
    // eslint-disable-next-line no-await-in-loop -- keep the delete batches serial
    await del(stale.slice(i, i + 100)).catch(() => {})
  }
}

export async function writeDb(next) {
  if (useLocalDatabase()) {
    await writeLocalDatabase(next)
    return null
  }

  const pathname = `${DATABASE_PREFIX}${Date.now()}-${crypto.randomUUID()}.enc`
  await put(pathname, encrypt(next), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/octet-stream',
    cacheControlMaxAge: 60,
  })
  return pathname
}

/**
 * Read-modify-write against the database.
 *
 * Blob storage has no compare-and-swap, so the hosted path is best effort: the
 * snapshot read at the start is re-checked immediately before writing, and the
 * write is re-checked after landing. A mutation that raced another instance is
 * retried from a fresh read instead of silently overwriting it. Two writes that
 * land in the same millisecond can still interleave — acceptable for a
 * single-admin settings store, but the reason this must not become a
 * high-write dataset.
 */
export async function updateDb(mutator) {
  const run = writing.then(async () => {
    // The local development store is a single file behind the queue above, so
    // there is no second writer for the snapshot dance to protect against.
    if (useLocalDatabase()) {
      const next = clone(await readLocalDatabase())
      await mutator(next)
      await writeLocalDatabase(next)
      return next
    }

    let lastError = null

    for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop -- each retry needs the previous result
      const { db, version } = await readSnapshot()
      const next = clone(db)
      // eslint-disable-next-line no-await-in-loop
      await mutator(next)

      // Someone else wrote between our read and now: start over on their copy.
      // eslint-disable-next-line no-await-in-loop
      const before = await allSnapshots()
      if ((before[0]?.pathname ?? null) !== version) {
        lastError = new Error('Another change was saved at the same time.')
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const pathname = await writeDb(next)

      // eslint-disable-next-line no-await-in-loop
      const after = await allSnapshots()
      if (after[0]?.pathname !== pathname) {
        lastError = new Error('Another change was saved at the same time.')
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      await prune(pathname).catch(() => {})
      return next
    }

    throw lastError ?? new Error('Could not save — the database is busy. Please retry.')
  })

  // The queue exists to serialise writes, not to spread one caller's failure.
  // Chaining `run` itself would hand its rejection to every later write, so a
  // single blob hiccup would keep failing until the instance was recycled.
  // The caller still sees `run`'s rejection.
  writing = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}
