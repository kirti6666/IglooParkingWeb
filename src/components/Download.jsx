import { ArrowIcon } from './Icons'
import AppStoreBadge from './AppStoreBadge'
import PlayStoreBadge from './PlayStoreBadge'
import { waLink, WA_MESSAGES } from '../config'
import { useSite } from '../ConfigContext'

export default function Download() {
  const { brand, links, contact } = useSite()

  return (
    <section className="fold download on-dark" id="download">
      <div className="hero__lines" aria-hidden="true" />

      <div className="shell download__inner">
        <h2 className="h-section download__title reveal">Get {brand.name}. Park smarter.</h2>
        <p className="download__sub reveal">
          {links.playStore
            ? 'Available now on iPhone and Android.'
            : 'Available now on iPhone. Android coming soon.'}
        </p>

        <div className="download__badges reveal">
          <AppStoreBadge
            href={links.appStore}
            label={`Download ${brand.name} ${brand.suffix} on the App Store`}
          />

          {/* The Play Store badge appears automatically once a Play Store URL is set. */}
          {links.playStore ? (
            <PlayStoreBadge
              href={links.playStore}
              label={`Get ${brand.name} ${brand.suffix} on Google Play`}
            />
          ) : null}
        </div>

        {!links.playStore && (
          <p className="download__android reveal">Android — coming soon</p>
        )}

        <p className="download__wa reveal">
          <a
            className="arrow-link arrow-link--light"
            href={waLink(contact.whatsappNumber, WA_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Prefer help getting started? Chat with us on WhatsApp <ArrowIcon />
          </a>
        </p>
      </div>
    </section>
  )
}
