import {
  ArrowIcon,
  ClockIcon,
  FormIcon,
  MapPinIcon,
  RupeeIcon,
  ToggleIcon,
  WalletIcon,
} from './Icons'
import { useSite } from '../ConfigContext'

/**
 * Feature cards run 3-across on desktop and stack on mobile, per the brief's
 * visual note. The cards are the content here — the phone screens live in the
 * hero and the "How it works" fold, so repeating them beside every card row
 * only added height without adding information.
 */
function FeatureCard({ icon, title, body }) {
  return (
    <article className="card reveal">
      <span className="card__icon">{icon}</span>
      <div>
        <h3 className="card__title">{title}</h3>
        <p className="card__body">{body}</p>
      </div>
    </article>
  )
}

/* ---------------- Fold 3: riders ---------------- */

export function RiderFeatures() {
  const { links } = useSite()

  return (
    <section className="fold features" id="riders">
      <div className="shell">
        <div className="features__head reveal">
          <p className="eyebrow">For riders</p>
          <h2 className="h-section features__title">
            Need a spot? Book it in one tap.
          </h2>
        </div>

        <div className="features__cards">
          <FeatureCard
            icon={<MapPinIcon size={22} />}
            title="Search Nearby"
            body="See open, roofed, and EV-charging spots near you — live on the map, updated in real time."
          />
          <FeatureCard
            icon={<ClockIcon size={22} />}
            title="Book Instantly"
            body="Choose your duration and vehicle, confirm your slot, and you're parked. No calls, no guesswork."
          />
          <FeatureCard
            icon={<RupeeIcon size={22} />}
            title="Pay As You Go"
            body="Transparent per-hour pricing shown upfront. Pay only for the time you use."
          />
        </div>

        <div className="features__foot reveal">
          <a
            className="btn btn--primary"
            href={links.appStore}
            target="_blank"
            rel="noopener noreferrer"
          >
            Find Parking Near You <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Fold 4: hosts ---------------- */

export function HostFeatures() {
  return (
    <section className="fold features features--host" id="hosts">
      <div className="shell">
        <div className="features__head reveal">
          <p className="eyebrow eyebrow--host">For hosts</p>
          <h2 className="h-section features__title">
            Have a spot? Start earning from it.
          </h2>
        </div>

        <div className="features__cards">
          <FeatureCard
            icon={<FormIcon size={22} />}
            title="List in Minutes"
            body="Add your address, set your hourly rate, and choose Open, Roofed, or Charging."
          />
          <FeatureCard
            icon={<ToggleIcon size={22} />}
            title="Stay in Control"
            body="Turn your listing on or off anytime. You decide when your space is available."
          />
          <FeatureCard
            icon={<WalletIcon size={22} />}
            title="Get Paid"
            body="Earn every time someone books your spot — with OTP-verified bookings for added security."
          />
        </div>

        <div className="features__foot reveal">
          <a className="btn btn--primary" href="#contact">
            Register as a Host <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  )
}
