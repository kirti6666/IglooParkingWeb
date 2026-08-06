/**
 * Image and video uploads for the admin panel.
 *
 * Every upload is checked three ways: extension, declared MIME type, and a
 * magic-number sniff of the actual bytes. A file that claims to be a JPEG but
 * isn't gets deleted. Filenames are generated, never taken from the client,
 * so a crafted name can't escape the uploads directory.
 */
import express from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import path from 'node:path'
import { readFile, unlink } from 'node:fs/promises'
import { UPLOAD_DIR } from '../db.js'
import { requireAuth } from '../auth.js'

const router = express.Router()

const ALLOWED = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED[ext]) {
      return cb(new Error('Only JPG, PNG, WebP, MP4 and WebM files are allowed.'))
    }
    if (file.mimetype !== ALLOWED[ext]) {
      return cb(new Error("That file's type doesn't match its extension."))
    }
    return cb(null, true)
  },
})

/** Reads the first bytes to confirm the file really is what it claims. */
async function sniff(filePath, ext) {
  const fd = await readFile(filePath)
  const head = fd.subarray(0, 16)
  const hex = head.toString('hex')
  const ascii = head.toString('latin1')

  if (ext === '.png') return hex.startsWith('89504e470d0a1a0a')
  if (ext === '.jpg' || ext === '.jpeg') return hex.startsWith('ffd8ff')
  if (ext === '.webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP'
  if (ext === '.mp4') return ascii.slice(4, 8) === 'ftyp'
  if (ext === '.webm') return hex.startsWith('1a45dfa3')
  return false
}

router.post('/', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const tooBig = err.code === 'LIMIT_FILE_SIZE'
      return res.status(400).json({
        error: tooBig ? 'That file is larger than 25 MB.' : err.message,
      })
    }
    if (!req.file) return res.status(400).json({ error: 'No file received.' })

    const ext = path.extname(req.file.filename).toLowerCase()
    if (!(await sniff(req.file.path, ext))) {
      await unlink(req.file.path).catch(() => {})
      return res.status(400).json({ error: "That file isn't a valid image or video." })
    }

    return res.status(201).json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      bytes: req.file.size,
    })
  })
})

router.delete('/:filename', requireAuth, async (req, res) => {
  // basename strips any path traversal attempt outright
  const name = path.basename(req.params.filename)
  const ext = path.extname(name).toLowerCase()
  if (!ALLOWED[ext]) return res.status(400).json({ error: 'Not a managed file.' })

  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {})
  return res.json({ ok: true })
})

export default router
