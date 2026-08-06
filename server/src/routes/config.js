import express from 'express'
import { readDb, updateDb } from '../db.js'
import { requireAuth } from '../auth.js'

const router = express.Router()

/** Public: the website reads its settings from here on every page load. */
router.get('/', async (req, res) => {
  const db = await readDb()
  res.json(db.config ?? null)
})

/** Protected: only a signed-in admin can change the live site. */
router.put('/', requireAuth, async (req, res) => {
  const incoming = req.body
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Expected a config object.' })
  }
  // Credentials never live in the site config.
  delete incoming.admin

  await updateDb(async (next) => {
    next.config = incoming
  })
  return res.json({ ok: true })
})

export default router
