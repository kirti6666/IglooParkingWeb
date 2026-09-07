import { GooglePlayIcon } from './Icons'

/**
 * Google Play badge — Google's black badge lockup with the official
 * four-colour Play mark (see GooglePlayIcon). Google's brand guidelines
 * forbid recolouring the mark, so it keeps its own colours against the
 * black pill rather than inheriting `currentColor` like our other icons.
 */
export default function PlayStoreBadge({ href, label = 'Get it on Google Play', large = false }) {
  return (
    <a
      className={`badge-store${large ? ' badge-store--lg' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <GooglePlayIcon size={large ? 32 : 28} />
      <span className="badge-store__text">
        <span className="badge-store__small badge-store__small--caps">Get it on</span>
        <span className="badge-store__big">Google Play</span>
      </span>
    </a>
  )
}
