import { ArrowIcon } from './Icons'
import { useSite } from '../ConfigContext'

const DETAILS = [
  {
    num: '01',
    title: 'Your contact details',
    body: 'Full name, mobile number, and email address.',
  },
  {
    num: '02',
    title: 'Your parking address',
    body: 'Building name, street name, pincode, and the parking location on the map.',
  },
  {
    num: '03',
    title: 'Your space details',
    body: 'Parking type — Open, Roofed, or EV charging — plus your hourly rate and availability.',
  },
  {
    num: '04',
    title: 'Booking verification',
    body: 'Choose whether OTP authentication is required for booking confirmation.',
  },
]

export default function HostRegistration() {
  const { links } = useSite()

  return (
    <section className="fold host-register" id="host-registration">
      <div className="shell host-register__grid">
        <div className="host-register__intro reveal">
          <p className="eyebrow eyebrow--host">Host registration</p>
          <h2 className="h-section host-register__title">
            Have these details ready.
          </h2>
          <p className="host-register__lede">
            Registration takes only a few minutes in the Igloo Parking app.
            Add accurate details so riders can find and book your space with
            confidence.
          </p>

          <div className="host-register__actions">
            <a
              className="btn btn--primary"
              href={links.appStore}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register on iPhone <ArrowIcon />
            </a>
            {links.playStore ? (
              <a
                className="btn btn--ghost"
                href={links.playStore}
                target="_blank"
                rel="noopener noreferrer"
              >
                Register on Android <ArrowIcon />
              </a>
            ) : null}
          </div>
        </div>

        <ol className="host-register__list" aria-label="Details needed to register">
          {DETAILS.map((detail) => (
            <li className="host-register__item reveal" key={detail.num}>
              <span className="host-register__num" aria-hidden="true">
                {detail.num}
              </span>
              <div>
                <h3>{detail.title}</h3>
                <p>{detail.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
