/**
 * The hero phone runs the app's core moment on load: locate, find nearby
 * spots, list them. It's a demonstration rather than a screenshot — the
 * headline claims "parking in seconds", so the phone shows those seconds.
 *
 * Every animation is entrance-only and respects prefers-reduced-motion
 * (see the media query in styles.css), so nothing loops forever in
 * someone's peripheral vision.
 */

const SPOTS = [
  { name: 'Koramangala 5th Block', meta: 'Roofed · 220 m', rate: '₹30' },
  { name: 'Jyoti Nivas Basement', meta: 'EV charging · 400 m', rate: '₹45' },
  { name: '1st Cross Driveway', meta: 'Open · 650 m', rate: '₹20' },
]

const PINS = [
  { left: '58%', top: '22%', rate: '₹30', delay: '0.75s', primary: true },
  { left: '27%', top: '44%', rate: '₹45', delay: '1s' },
  { left: '71%', top: '38%', rate: '₹20', delay: '1.25s' },
]

export default function HeroPhone() {
  return (
    <div className="hero-phone">
      <span className="hero-phone__stage" aria-hidden="true" />
      <div className="phone">
        <div className="phone__notch" />
        <div className="phone__screen">
          <div className="phone__canvas">
            <div className="hmap">
            <div className="hmap__grid" />
            <div className="hmap__road hmap__road--h" />
            <div className="hmap__road hmap__road--v" />

            {/* search chip */}
            <div className="hmap__search">
              <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                />
                <path
                  d="m16 16 4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
              <span>Parking near me</span>
            </div>

            {/* the searching pulse, radiating from the visitor's position */}
            <div className="hmap__radar" aria-hidden="true">
              <span className="hmap__ring" />
              <span className="hmap__ring hmap__ring--2" />
              <span className="hmap__you" />
            </div>

            {/* price pins land one after another */}
            {PINS.map((pin) => (
              <div
                className="hmap__pin"
                key={pin.rate}
                style={{ left: pin.left, top: pin.top, animationDelay: pin.delay }}
              >
                <span
                  className={`hmap__price${pin.primary ? ' hmap__price--primary' : ''}`}
                >
                  {pin.rate}/hr
                </span>
                <span className="hmap__stem" />
              </div>
            ))}

            {/* results sheet slides up once the pins have landed */}
            <div className="hmap__sheet">
              <div className="hmap__handle" />
              <p className="hmap__count">3 spots found nearby</p>
              {SPOTS.map((spot, i) => (
                <div
                  className="hmap__row"
                  key={spot.name}
                  style={{ animationDelay: `${1.75 + i * 0.12}s` }}
                >
                  <div>
                    <p className="hmap__name">{spot.name}</p>
                    <p className="hmap__meta">{spot.meta}</p>
                  </div>
                  <span className="hmap__rate">{spot.rate}/hr</span>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
