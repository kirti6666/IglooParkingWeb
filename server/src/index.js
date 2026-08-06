import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { UPLOAD_DIR, readDb, updateDb } from './db.js'
import { sameOriginOnly } from './auth.js'
import authRoutes, { seedAdmin } from './routes/auth.js'
import configRoutes from './routes/config.js'
import mediaRoutes from './routes/media.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)
const ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

// Behind a reverse proxy (nginx, Render, Railway) so rate limiting sees the
// real client IP rather than the proxy's.
app.set('trust proxy', 1)

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: ORIGIN, credentials: true }))
app.use(express.json({ limit: '256kb' }))
app.use(cookieParser())
app.use(sameOriginOnly)

// A broad ceiling; the login and reset routes are limited far more tightly.
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120 }))

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }))

app.use('/api/auth', authRoutes)
app.use('/api/config', configRoutes)
app.use('/api/media', mediaRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong.' })
})

async function start() {
  // Seed the site config from the frontend defaults on very first boot.
  const db = await readDb()
  if (!db.config) {
    const { defaultConfig } = await import('../../src/config.js')
    const seed = JSON.parse(JSON.stringify(defaultConfig))
    delete seed.admin
    await updateDb(async (next) => {
      next.config = seed
    })
    console.log('✓ Seeded site config from src/config.js defaults')
  }

  await seedAdmin()

  app.listen(PORT, () => {
    console.log(`Igloo API listening on http://localhost:${PORT}`)
    console.log(`Allowing requests from ${ORIGIN}`)
  })
}

start().catch((err) => {
  console.error('Failed to start:', err.message)
  process.exit(1)
})
