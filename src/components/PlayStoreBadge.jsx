import { PlayStoreIcon } from './Icons'

export default function PlayStoreBadge({ href, label = 'Get it on Google Play', large = false }) {
  return (
    <a
      className={`badge-store${large ? ' badge-store--lg' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <PlayStoreIcon size={large ? 32 : 28} />
      <span className="badge-store__text">
        <span className="badge-store__small">Get it on</span>
        <span className="badge-store__big">Google Play</span>
      </span>
    </a>
  )
}
