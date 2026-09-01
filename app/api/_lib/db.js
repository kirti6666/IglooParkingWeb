import crypto from 'node:crypto'
import { Redis } from '@upstash/redis'
import { defaultConfig } from '../../../src/config.js'

const DB_KEY = 'igloo:database:v1'
const LOCK_KEY = 'igloo:database-lock:v1'
const EMPTY = { config: null, users: [], resetTokens: [], valetLeads: [] }

const clone = (value) => JSON.parse(JSON.stringify(value))
let client = null

function redis() {
  if (client) return client
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    throw new Error(
      'Redis is not connected. Add an Upstash Redis store to this Vercel project.',
    )
  }
  client = new Redis({ url, token })
  return client
}

function normalise(value) {
  const db = value && typeof value === 'object' ? value : clone(EMPTY)
  db.users ??= []
  db.resetTokens ??= []
  db.valetLeads ??= []
  if (!db.config) {
    db.config = clone(defaultConfig)
    delete db.config.admin
  }
  return db
}

export async function readDb() {
  const store = redis()
  const existing = await store.get(DB_KEY)
  if (existing) return normalise(existing)

  const initial = normalise(null)
  await store.set(DB_KEY, initial, { nx: true })
  return normalise((await store.get(DB_KEY)) || initial)
}

export async function writeDb(next) {
  await redis().set(DB_KEY, next)
}

async function acquireLock() {
  const store = redis()
  const token = crypto.randomUUID()
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const acquired = await store.set(LOCK_KEY, token, { nx: true, px: 5000 })
    if (acquired === 'OK') return token
    await new Promise((resolve) => setTimeout(resolve, 50 + attempt * 10))
  }
  throw new Error('The database is busy. Please try again.')
}

async function releaseLock(token) {
  await redis().eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    [LOCK_KEY],
    [token],
  )
}

export async function updateDb(mutator) {
  const lock = await acquireLock()
  try {
    const next = clone(await readDb())
    await mutator(next)
    await writeDb(next)
    return next
  } finally {
    await releaseLock(lock).catch(() => {})
  }
}
