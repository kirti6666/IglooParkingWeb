import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { UPLOAD_DIR, readDb, updateDb } from './db.js'
import { sameOriginOnly } from './auth.js'
import authRoutes, { seedAdmin } from './routes/auth.js'
import configRoutes from './routes/config.js'
import mediaRoutes from './routes/media.js'
import valetRoutes from './routes/valet.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)
const ORIGIN = process.env.FRONTEND_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173'
const here = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(here, '..', '..', 'dist')

// Behind a reverse proxy (nginx, Render, Railway) so rate limiting sees the
// real client IP rather than the proxy's.
app.set('trust proxy', 1)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        mediaSrc: ["'self'", 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  }),
)
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
app.use('/api/valet', valetRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Unknown API endpoints should stay JSON responses instead of falling through
// to the single-page application.
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }))

// In production the API and the built React site share one origin. This keeps
// admin cookies first-party and lets one Render service deploy the whole app.
if (existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(
    express.static(DIST_DIR, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache')
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    }),
  )
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

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
