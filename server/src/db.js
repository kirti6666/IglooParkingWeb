/**
 * A tiny JSON-file store. Deliberately dependency-free: this site has one
 * admin and a handful of settings, so a database would be overkill.
 * Writes go to a temp file and are renamed, so a crash mid-write can't
 * leave a half-written file behind.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = path.join(here, '..', 'data')
export const UPLOAD_DIR = path.join(here, '..', 'uploads')
const DB_PATH = path.join(DATA_DIR, 'db.json')

for (const dir of [DATA_DIR, UPLOAD_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const EMPTY = { config: null, users: [], resetTokens: [] }

let cache = null
let writing = Promise.resolve()

export async function readDb() {
  if (cache) return cache
  try {
    cache = JSON.parse(await readFile(DB_PATH, 'utf8'))
  } catch {
    cache = structuredCloneSafe(EMPTY)
  }
  return cache
}

/** Serialises writes so two concurrent requests can't clobber each other. */
export async function writeDb(next) {
  cache = next
  writing = writing.then(async () => {
    const tmp = `${DB_PATH}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(next, null, 2), 'utf8')
    await rename(tmp, DB_PATH)
  })
  return writing
}

export async function updateDb(mutator) {
  const db = await readDb()
  const next = structuredCloneSafe(db)
  await mutator(next)
  await writeDb(next)
  return next
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value))
}
