import { AppleIcon } from './Icons'

/**
 * App Store badge — Apple's black badge treatment with the Apple logo.
 *
 * Apple's marketing guidelines ask for their supplied badge artwork. This is a
 * faithful stand-in so the page looks right today; swap in the official SVG
 * before go-live (see the README for the link and the exact replacement).
 */
export default function AppStoreBadge({ href, label = 'Download on the App Store', large = false }) {
  return (
    <a
      className={`badge-store${large ? ' badge-store--lg' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <AppleIcon size={large ? 32 : 28} />
      <span className="badge-store__text">
        <span className="badge-store__small">Download on the</span>
        <span className="badge-store__big">App Store</span>
      </span>
    </a>
  )
}
