/**
 * Igloo logo.
 *
 * Two crops of the same supplied artwork (public/logo*.png), because the
 * stacked lockup's wordmark and tagline are unreadable at header height:
 *
 *   mark   — the arc, car and parking sign, shown beside the wordmark text
 *            in the header, where the bar is ~64px tall
 *   lockup — the complete artwork, wordmark and tagline included, for the
 *            footer, where there is room for it to be read
 *
 * Each has a reversed version whose ink is white, for the dark footer and for
 * the header while it sits transparently over the hero.
 */

import { useSite } from '../ConfigContext'

const LOGO = {
  mark: { dark: '/logo-mark.png', light: '/logo-mark-light.png' },
  lockup: { dark: '/logo.png', light: '/logo-light.png' },
}

export default function Logo({ light = false, height = 38, href = '#top', lockup = false }) {
  const { brand } = useSite()
  const src = LOGO[lockup ? 'lockup' : 'mark'][light ? 'light' : 'dark']

  return (
    <a
      className={`logo${lockup ? ' logo--lockup' : ''}${light ? ' logo--light' : ''}`}
      href={href}
    >
      <img
        className="logo__img"
        src={src}
        /* The lockup carries its own wordmark; the mark is decorative because
           the text beside it already names the brand. */
        alt={lockup ? `${brand.name} ${brand.suffix} — ${brand.tagline}` : ''}
        style={{ '--logo-height': `${height}px` }}
      />
      {lockup ? null : (
        <span className="logo__word">
          {brand.name}
          <span> {brand.suffix}</span>
        </span>
      )}
    </a>
  )
}
