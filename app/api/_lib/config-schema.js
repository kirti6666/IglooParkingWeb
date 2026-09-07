/**
 * Validation for the site configuration the admin panel publishes.
 *
 * The published config is rendered straight into the public page: image `src`,
 * footer link `href`, colours written onto CSS custom properties. Accepting it
 * as opaque JSON meant a stored `javascript:` href reached every visitor, and
 * a malformed shape could break rendering for everyone. So the incoming
 * document is rebuilt field by field here — unknown keys are dropped, strings
 * are trimmed and capped, and anything that lands in an href or src has to be
 * an http(s) or same-site URL.
 */

const MAX = {
  short: 120,
  line: 300,
  url: 2048,
  images: 24,
  videos: 12,
  footerLinks: 12,
}

const text = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SCHEME = /^([a-z][a-z0-9+.-]*):/i

/**
 * Keeps only URLs that are safe to put in an `href` or `src`.
 *
 * Allowed: absolute http/https, and same-document or site-relative values
 * (`/gallery/x.jpg`, `./terms.html`, `#contact`) which the shipped defaults
 * use. Everything with another scheme is dropped — `javascript:`, `data:` and
 * `vbscript:` all execute when they reach an anchor.
 */
function safeUrl(value, fallback = '') {
  const raw = text(value, MAX.url)
  if (!raw) return ''

  const scheme = raw.match(SCHEME)?.[1]?.toLowerCase()
  if (scheme) return scheme === 'http' || scheme === 'https' ? raw : fallback

  // Scheme-relative `//evil.example` inherits the page scheme — treat it as
  // absolute and require it to parse as http(s).
  if (raw.startsWith('//')) {
    try {
      return new URL(`https:${raw}`).protocol === 'https:' ? raw : fallback
    } catch {
      return fallback
    }
  }

  // A backslash is read as a slash by browsers, so `/\evil.example` escapes
  // the site. Anything else relative is fine.
  return raw.includes('\\') ? fallback : raw
}

const color = (value, fallback) => {
  const raw = text(value, 32)
  return HEX_COLOR.test(raw) ? raw : fallback
}

const email = (value, fallback) => {
  const raw = text(value, MAX.short).toLowerCase()
  return EMAIL.test(raw) ? raw : fallback
}

const list = (value, max, map) =>
  Array.isArray(value) ? value.slice(0, max).map(map) : []

/**
 * Rebuilds a config document from `incoming`, falling back to `current` (the
 * config already published) field by field so a partial or hostile payload
 * can never blank out or poison the live site.
 */
export function sanitiseConfig(incoming, current) {
  const from = incoming && typeof incoming === 'object' && !Array.isArray(incoming)
    ? incoming
    : {}
  const base = current && typeof current === 'object' ? current : {}

  const pick = (section) => {
    const value = from[section]
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  }

  const brand = pick('brand')
  const colors = pick('colors')
  const contact = pick('contact')
  const links = pick('links')
  const media = pick('media')

  return {
    brand: {
      name: text(brand.name, MAX.short) || base.brand?.name || '',
      suffix: text(brand.suffix, MAX.short),
      tagline: text(brand.tagline, MAX.line) || base.brand?.tagline || '',
    },

    colors: {
      primary: color(colors.primary, base.colors?.primary ?? '#1782a6'),
      deep: color(colors.deep, base.colors?.deep ?? '#0b5b78'),
      gradientFrom: color(colors.gradientFrom, base.colors?.gradientFrom ?? '#4a9fd8'),
      gradientTo: color(colors.gradientTo, base.colors?.gradientTo ?? '#3fbfc4'),
      host: color(colors.host, base.colors?.host ?? '#b14a12'),
      ink: color(colors.ink, base.colors?.ink ?? '#0a2230'),
    },

    contact: {
      // wa.me takes digits only; anything else breaks the link.
      whatsappNumber: text(contact.whatsappNumber, 20).replace(/\D/g, ''),
      whatsappDisplay: text(contact.whatsappDisplay, 40),
      email: email(contact.email, base.contact?.email ?? ''),
      instagram: safeUrl(contact.instagram, base.contact?.instagram ?? ''),
    },

    links: {
      appStore: safeUrl(links.appStore, base.links?.appStore ?? ''),
      playStore: safeUrl(links.playStore, base.links?.playStore ?? ''),
      formEndpoint: safeUrl(links.formEndpoint, base.links?.formEndpoint ?? ''),
    },

    media: {
      galleryTitle: text(media.galleryTitle, MAX.line),
      gallerySubtitle: text(media.gallerySubtitle, MAX.line * 2),
      images: list(media.images, MAX.images, (image) => ({
        src: safeUrl(image?.src),
        alt: text(image?.alt, MAX.line),
        caption: text(image?.caption, MAX.short),
      })),
      videos: list(media.videos, MAX.videos, (video) => ({
        src: safeUrl(video?.src),
        poster: safeUrl(video?.poster),
        caption: text(video?.caption, MAX.short),
      })),
    },

    footerLinks: list(from.footerLinks, MAX.footerLinks, (link) => ({
      label: text(link?.label, MAX.short),
      href: safeUrl(link?.href),
    })).filter((link) => link.label),
  }
}
