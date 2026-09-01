import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { defaultConfig } from './config'
import { api, hasBackend, portableMediaUrl } from './api'

const STORAGE_KEY = 'igloo.siteConfig.v1'

const ConfigContext = createContext(null)

/** Deep-merges a saved config over the defaults so new fields added in a
 *  later release don't break an older saved copy. */
function merge(base, patch) {
  if (!patch || typeof patch !== 'object') return base
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = merge(base?.[key] ?? {}, value)
    } else if (value !== undefined) {
      out[key] = value
    }
  }
  return out
}

/** The config is plain JSON, so this is a safe deep clone — and unlike
 *  structuredClone it works on older Safari and Android WebViews. */
function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function setAtPath(value, path, nextValue) {
  const next = clone(value)
  const keys = path.split('.')
  let node = next
  for (const key of keys.slice(0, -1)) node = node[key]
  node[keys.at(-1)] = nextValue
  return next
}

/** Convert the original single-video shape to the newer card collection while
 * keeping already-published configurations fully backwards compatible. */
function normaliseConfig(saved) {
  const next = merge(defaultConfig, saved)
  if (!Array.isArray(saved?.media?.videos) && saved?.media?.video) {
    next.media.videos = [saved.media.video]
  }
  if (!Array.isArray(next.media?.videos)) next.media.videos = []
  delete next.media.video
  return next
}

/** Storage can throw in sandboxed frames and private modes, so every access
 *  is guarded — the site must work whether or not it succeeds. */
function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(config) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() =>
    normaliseConfig(hasBackend ? null : readStored()),
  )
  const [saving, setSaving] = useState(false)

  // With a backend, the server is the source of truth for every visitor.
  useEffect(() => {
    if (!hasBackend) return
    let cancelled = false
    api
      .getConfig()
      .then((remote) => {
        if (!cancelled && remote) setConfig(normaliseConfig(remote))
      })
      .catch(() => {
        /* API unreachable — the shipped defaults still render the site */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Push theme colours onto the document as CSS custom properties.
  useEffect(() => {
    const root = document.documentElement
    const c = config.colors
    root.style.setProperty('--lagoon', c.primary)
    root.style.setProperty('--depth', c.deep)
    root.style.setProperty('--sky', c.gradientFrom)
    root.style.setProperty('--teal', c.gradientTo)
    root.style.setProperty('--ember', c.host)
    root.style.setProperty('--night', c.ink)
    root.style.setProperty(
      '--grad-hero',
      `linear-gradient(135deg, ${c.gradientFrom} 0%, ${c.gradientTo} 100%)`,
    )
  }, [config.colors])

  async function publish(candidate) {
    if (!hasBackend) {
      return writeStored(candidate)
        ? { ok: true, message: 'Saved to this browser only — no backend is connected.' }
        : { ok: false, message: "This browser blocked storage, so nothing was saved." }
    }
    setSaving(true)
    try {
      const payload = clone(candidate)
      delete payload.admin
      delete payload.media?.video
      if (Array.isArray(payload.media?.images)) {
        payload.media.images = payload.media.images.map((image) => ({
          ...image,
          src: portableMediaUrl(image?.src),
        }))
      }
      if (Array.isArray(payload.media?.videos)) {
        payload.media.videos = payload.media.videos.map((video) => ({
          ...video,
          src: portableMediaUrl(video?.src),
          poster: portableMediaUrl(video?.poster),
        }))
      }
      await api.saveConfig(payload)
      return { ok: true, message: 'Published. Every visitor sees this now.' }
    } catch (err) {
      return {
        ok: false,
        message:
          err.status === 401
            ? 'Your session expired. Sign in again.'
            : `Could not publish: ${err.message}`,
      }
    } finally {
      setSaving(false)
    }
  }

  const value = useMemo(
    () => ({
      config,
      /** Update one field by path, e.g. update('contact.email', '…') */
      update(path, val) {
        setConfig((prev) => setAtPath(prev, path, val))
      },
      replace: (next) => setConfig(normaliseConfig(next)),
      saving,
      /** Publishes to the server when there is one; otherwise saves to this
       *  browser only. Returns a short message describing what happened. */
      save: (candidate = config) => publish(normaliseConfig(candidate)),
      reset() {
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* nothing to clear */
        }
        setConfig(normaliseConfig(null))
      },
    }),
    [config, saving],
  )

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

/** Read-only access to the current config — what most components need. */
export function useSite() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useSite must be used inside <ConfigProvider>')
  return ctx.config
}

/** Full access including mutators — used by the admin panel. */
export function useConfigAdmin() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfigAdmin must be used inside <ConfigProvider>')
  return ctx
}
