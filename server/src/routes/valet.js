import crypto from 'node:crypto'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { readDb, updateDb } from '../db.js'
import { requireAuth } from '../auth.js'

const router = express.Router()

const submitLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many valet enquiries. Please try again later.' },
})

const clean = (value, max = 180) => String(value || '').trim().slice(0, max)

router.post('/', submitLimit, async (req, res) => {
  // Honeypot fields are silently accepted without storing the submission.
  if (clean(req.body?.website)) return res.status(201).json({ ok: true })

  const lead = {
    businessName: clean(req.body?.businessName),
    contactName: clean(req.body?.contactName),
    mobile: clean(req.body?.mobile, 30),
    email: clean(req.body?.email).toLowerCase(),
    addressLine1: clean(req.body?.addressLine1, 240),
    location: clean(req.body?.location),
    city: clean(req.body?.city),
    pin: clean(req.body?.pin, 12),
    state: clean(req.body?.state),
  }

  if (Object.values(lead).some((value) => !value)) {
    return res.status(400).json({ error: 'Please complete every required field.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (!/^\d{7,15}$/.test(lead.mobile.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Please enter a valid mobile number.' })
  }
  if (!/^\d{6}$/.test(lead.pin)) {
    return res.status(400).json({ error: 'PIN code must contain 6 digits.' })
  }

  const record = {
    id: crypto.randomUUID(),
    ...lead,
    submittedAt: new Date().toISOString(),
  }

  await updateDb(async (next) => {
    if (!Array.isArray(next.valetLeads)) next.valetLeads = []
    next.valetLeads.push(record)
  })

  return res.status(201).json({ ok: true, id: record.id })
})

router.get('/', requireAuth, async (req, res) => {
  const db = await readDb()
  const leads = Array.isArray(db.valetLeads) ? [...db.valetLeads].reverse() : []
  return res.json({ leads })
})

export default router
