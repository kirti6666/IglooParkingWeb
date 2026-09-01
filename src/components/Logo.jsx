/**
 * Igloo logo.
 *
 * A supplied lockup (brand.logo) wins when one is set — upload it in the
 * admin panel's Brand tab, or drop a file in public/ and point brand.logo at
 * it. Otherwise this falls back to the built-in SVG: a snow dome built from
 * courses of blocks, with the entrance arch doing double duty as the parking
 * "P".
 *
 * A supplied lockup usually carries its own wordmark, so the text beside the
 * mark is dropped in that case rather than printing the name twice.
 */

import { useSite } from '../ConfigContext'
import { mediaUrl } from '../api'

export default function Logo({ light = false, size = 36, href = '#top' }) {
  const { brand } = useSite()
  const supplied =
    (light ? brand.logoLight?.trim() : '') || brand.logo?.trim() || ''
  const dome = light ? '#ffffff' : '#1782a6'
  const door = light ? '#1782a6' : '#ffffff'
  const line = light ? 'rgba(23,130,166,0.55)' : 'rgba(255,255,255,0.75)'

  if (supplied) {
    return (
      <a className={`logo logo--image${light ? ' logo--light' : ''}`} href={href}>
        <img
          className="logo__img"
          src={mediaUrl(supplied)}
          alt={`${brand.name} ${brand.suffix}`}
          style={{ height: Math.round(size * 1.15) }}
        />
      </a>
    )
  }

  return (
    <a className={`logo${light ? ' logo--light' : ''}`} href={href}>
      <svg
        className="logo__mark"
        width={size}
        height={size * 0.85}
        viewBox="0 0 40 34"
        aria-hidden="true"
      >
        {/* dome */}
        <path d="M2 29a18 18 0 0 1 36 0Z" fill={dome} />
        {/* block courses */}
        <path d="M5.2 20.5h29.6M9 13.2h22" stroke={line} strokeWidth="1.4" fill="none" />
        {/* entrance arch */}
        <path d="M14 29v-4.2a6 6 0 0 1 12 0V29Z" fill={door} />
        {/* the P inside the entrance */}
        <text
          x="20"
          y="28.4"
          textAnchor="middle"
          fontFamily="Archivo, Helvetica, Arial, sans-serif"
          fontSize="11"
          fontWeight="900"
          fill={dome}
        >
          P
        </text>
        {/* ground line */}
        <rect x="0" y="29.6" width="40" height="2.6" rx="1.3" fill={dome} opacity="0.35" />
      </svg>
      <span className="logo__word">
        {brand.name}
        <span> {brand.suffix}</span>
      </span>
    </a>
  )
}
