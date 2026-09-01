import { forwardRef } from 'react'
import HeroPhone from './HeroPhone'
import BayLines from './BayLines'
import { ArrowIcon } from './Icons'
import AppStoreBadge from './AppStoreBadge'
import PlayStoreBadge from './PlayStoreBadge'
import { waLink, WA_MESSAGES } from '../config'
import { useSite } from '../ConfigContext'

// Straight from the brief's own feature copy — no invented metrics.
const CHIPS = ['Open', 'Roofed', 'EV charging']

const Hero = forwardRef(function Hero(_props, ref) {
  const { brand, links, contact } = useSite()
  const words = brand.tagline.split(' ').filter(Boolean)

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero__glow" aria-hidden="true" />
      <BayLines />

      <div className="shell hero__inner on-dark">
        <div className="hero__copy">
          {/* no logo here — the fixed header carries the wordmark from the
              very top now, so repeating it directly beneath was redundant */}
          <p className="hero__tag">
            <span className="hero__dot" aria-hidden="true" />
            {links.playStore ? 'Now live on iPhone & Android' : 'Now live on iPhone'}
          </p>

          <h1 className="h-display hero__title">
            {words.map((word, i) => (
              <span className="hero__line" key={word}>
                <em style={{ animationDelay: `${0.15 + i * 0.11}s` }}>{word}</em>
              </span>
            ))}
          </h1>

          <p className="hero__sub">
            Find parking in seconds — or list your empty spot and start earning from
            it today.
          </p>

          <ul className="hero__chips" aria-label="Spot types on Igloo">
            {CHIPS.map((chip) => (
              <li className="hero__chip" key={chip}>
                {chip}
              </li>
            ))}
          </ul>

          <div className="hero__ctas">
            <div className="hero__stores">
              <AppStoreBadge href={links.appStore} large />
              {links.playStore ? (
                <PlayStoreBadge
                  href={links.playStore}
                  label={`Get ${brand.name} ${brand.suffix} on Google Play`}
                  large
                />
              ) : null}
            </div>
            <a className="btn btn--outline-light" href="#hosts">
              List Your Parking Space
            </a>
          </div>

          <p className="hero__wa">
            <a
              className="arrow-link arrow-link--light"
              href={waLink(contact.whatsappNumber, WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Prefer to talk? Chat with us on WhatsApp <ArrowIcon />
            </a>
          </p>
        </div>

        <div className="hero__art">
          <HeroPhone />
        </div>
      </div>
    </section>
  )
})

export default Hero
