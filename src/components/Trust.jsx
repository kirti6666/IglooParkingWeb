import { FlagIcon, HeadsetIcon, ShieldIcon } from './Icons'

const POINTS = [
  {
    icon: <ShieldIcon />,
    label: 'OTP-secured bookings',
    body: 'Every parking session verified.',
  },
  {
    icon: <FlagIcon />,
    label: 'In-app issue reporting',
    body: 'Flag a problem in seconds.',
  },
  {
    icon: <HeadsetIcon />,
    label: 'Real support',
    body: 'Help and support built right into the app.',
  },
]

export default function Trust() {
  return (
    <section className="fold trust on-dark">
      <div className="shell">
        <div className="trust__head reveal">
          <h2 className="h-section trust__title">Safe, simple, always supported.</h2>
        </div>

        <div className="trust__grid">
          {POINTS.map((point) => (
            <div className="trust__item reveal" key={point.label}>
              <span className="trust__icon">{point.icon}</span>
              <h3 className="trust__label">{point.label}</h3>
              <p className="trust__body">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
