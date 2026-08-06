/**
 * Igloo logo: a snow dome built from courses of blocks, with the entrance
 * arch doing double duty as the parking "P".
 *
 * To use a supplied logo file instead, replace the <svg> below with:
 *   <img src="/logo.svg" alt="Igloo Parking" className="logo__mark" height="34" />
 */

import { useSite } from '../ConfigContext'

export default function Logo({ light = false, size = 36, href = '#top' }) {
  const { brand } = useSite()
  const dome = light ? '#ffffff' : '#1782a6'
  const door = light ? '#1782a6' : '#ffffff'
  const line = light ? 'rgba(23,130,166,0.55)' : 'rgba(255,255,255,0.75)'

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
