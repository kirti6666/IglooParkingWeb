import crypto from 'node:crypto'
import { get, list, put } from '@vercel/blob'
import { defaultConfig } from '../../../src/config.js'

const DATABASE_PREFIX = 'igloo-private/database/'
const EMPTY = { config: null, users: [], resetTokens: [], valetLeads: [], hostRegistrations: [] }

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
    delete db.config.admin
  }
  return db
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

async function latestSnapshot() {
  const { blobs } = await list({ prefix: DATABASE_PREFIX, limit: 1000 })
  return blobs.sort(
    (left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime(),
  )[0]
}

export async function readDb() {
  const snapshot = await latestSnapshot()
  if (!snapshot) return normalise(null)

  const result = await get(snapshot.url, { access: 'public', useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) return normalise(null)
  const payload = await new Response(result.stream).text()
  return normalise(decrypt(payload))
}

export async function writeDb(next) {
  const pathname = `${DATABASE_PREFIX}${Date.now()}-${crypto.randomUUID()}.enc`
  await put(pathname, encrypt(next), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/octet-stream',
    cacheControlMaxAge: 60,
  })
}

export async function updateDb(mutator) {
  let result
  writing = writing.then(async () => {
    const next = clone(await readDb())
    await mutator(next)
    await writeDb(next)
    result = next
  })
  await writing
  return result
}
