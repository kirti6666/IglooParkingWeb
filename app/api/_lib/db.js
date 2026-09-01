import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defaultConfig } from '../../../src/config.js'

const storageRoot = process.env.IGLOO_STORAGE_DIR?.trim() || process.cwd()

export const DATA_DIR = path.join(storageRoot, 'data')
export const UPLOAD_DIR = path.join(storageRoot, 'uploads')
const DB_PATH = path.join(DATA_DIR, 'db.json')

const EMPTY = { config: null, users: [], resetTokens: [], valetLeads: [] }
let cache = null
let writing = Promise.resolve()
let directoriesReady = null

const clone = (value) => JSON.parse(JSON.stringify(value))

export function ensureStorage() {
  directoriesReady ??= Promise.all([
    mkdir(DATA_DIR, { recursive: true }),
    mkdir(UPLOAD_DIR, { recursive: true }),
  ])
  return directoriesReady
}

export async function readDb() {
  if (cache) return cache
  await ensureStorage()
  try {
    cache = JSON.parse(await readFile(DB_PATH, 'utf8'))
  } catch {
    cache = clone(EMPTY)
  }

  cache.users ??= []
  cache.resetTokens ??= []
  cache.valetLeads ??= []

  if (!cache.config) {
    cache.config = clone(defaultConfig)
    delete cache.config.admin
    await writeDb(cache)
  }

  return cache
}

export async function writeDb(next) {
  await ensureStorage()
  cache = next
  writing = writing.then(async () => {
    const temporaryPath = `${DB_PATH}.${process.pid}.tmp`
    await writeFile(temporaryPath, JSON.stringify(next, null, 2), 'utf8')
    await rename(temporaryPath, DB_PATH)
  })
  return writing
}

export async function updateDb(mutator) {
  const next = clone(await readDb())
  await mutator(next)
  await writeDb(next)
  return next
}
