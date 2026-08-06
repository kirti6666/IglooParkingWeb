/**
 * Phone mockups.
 *
 * The app screenshots aren't ready yet, so these three screens are drawn in
 * CSS to match the real app's design. When the screenshots arrive, drop the
 * PNGs into /public and swap any <PhoneMockup> screen for:
 *
 *   <img src="/screens/host-registration.png" alt="" className="phone__shot" />
 *
 * inside the .phone__screen div — everything else stays.
 */

/** Screens are drawn at a fixed 270px design width (the visible screen, inside
 *  the frame's 11px bezel), so shrinking the frame must scale the contents with
 *  it — otherwise fixed-px children like the OTP boxes spill out and get
 *  clipped. Scale is measured against the SCREEN, not the outer frame. */
const DESIGN_SCREEN = 270
const BEZEL = 22 // 11px each side

function Frame({ children, caption, captionDark = false, tilt = false, size }) {
  const vars = size
    ? {
        '--phone-w': `${size}px`,
        '--phone-scale': (size - BEZEL) / DESIGN_SCREEN,
      }
    : undefined

  return (
    <div>
      <div className={`phone${tilt ? ' phone--tilt' : ''}`} style={vars}>
        <div className="phone__notch" />
        <div className="phone__screen">
          <div className="phone__canvas">{children}</div>
        </div>
      </div>
      {caption ? (
        <p className={`phone__caption${captionDark ? ' phone__caption--dark' : ''}`}>
          {caption}
        </p>
      ) : null}
    </div>
  )
}

/* ---------------- Screen 1: Host registration ---------------- */

function HostRegistrationScreen() {
  const fields = [
    ['Enter your name', true],
    ['Building name', false],
    ['Street name', true],
    ['Pincode', true],
    ['Parking place location', true],
    ['Email', true],
  ]

  return (
    <div className="scr">
      <div className="scr__card">
        <p className="scr__title">Host Registration</p>
        {fields.map(([label, required]) => (
          <div className="scr__field" key={label}>
            <span>
              {label} {required ? <span className="scr__req">*</span> : null}
            </span>
            {label === 'Parking place location' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#6b7a83"
                  d="M12 22s7-5.9 7-11.4A7 7 0 1 0 5 10.6C5 16.1 12 22 12 22Zm0-8.8a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z"
                />
              </svg>
            ) : null}
          </div>
        ))}
        <div className="scr__toggle-row">
          <p className="scr__toggle-label">
            OTP authentication required for booking confirmation?
          </p>
          <span className="scr__toggle" />
        </div>
        <div className="scr__btn">SAVE</div>
      </div>
    </div>
  )
}

/* ---------------- Screen 2: Map / find a spot ---------------- */

function MapScreen() {
  const spots = [
    ['Koramangala 5th Block', 'Roofed · 220 m', '₹30/hr'],
    ['Jyoti Nivas Basement', 'EV charging · 400 m', '₹45/hr'],
    ['1st Cross Driveway', 'Open · 650 m', '₹20/hr'],
  ]

  return (
    <div className="map">
      <div className="map__grid" />
      <div className="map__road map__road--h" />
      <div className="map__road map__road--v" />
      <div className="map__you" style={{ left: '32%', top: '30%' }} />
      <div className="map__pin" style={{ left: '58%', top: '24%' }}>
        <span className="map__price">₹30/hr</span>
      </div>
      <div className="map__pin" style={{ left: '28%', top: '52%' }}>
        <span className="map__price map__price--alt">₹45/hr</span>
      </div>
      <div className="map__pin" style={{ left: '72%', top: '46%' }}>
        <span className="map__price map__price--alt">₹20/hr</span>
      </div>

      <div className="map__sheet">
        <div className="map__handle" />
        {spots.map(([name, meta, rate]) => (
          <div className="map__row" key={name}>
            <div>
              <p className="map__name">{name}</p>
              <p className="map__meta">{meta}</p>
            </div>
            <span className="map__rate">{rate}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Screen 3: OTP ---------------- */

function OtpScreen() {
  return (
    <div className="otp">
      <p className="otp__title">Verify your number</p>
      <p className="otp__sub">
        We sent a 6-digit code to your phone. Enter it to confirm your booking.
      </p>
      <div className="otp__boxes">
        {['4', '9', '2', '7'].map((d, i) => (
          <span className="otp__box" key={i}>
            {d}
          </span>
        ))}
        <span className="otp__box otp__box--empty">
          <span className="otp__caret" />
        </span>
        <span className="otp__box otp__box--empty" />
      </div>
      <p className="otp__note">Resend code in 00:24</p>
      <div className="otp__btn">CONFIRM</div>
    </div>
  )
}

/* ---------------- Public component ---------------- */

const SCREENS = {
  host: HostRegistrationScreen,
  map: MapScreen,
  otp: OtpScreen,
}

export default function PhoneMockup({
  screen = 'host',
  caption,
  captionDark,
  tilt,
  size,
}) {
  const Screen = SCREENS[screen] || HostRegistrationScreen
  return (
    <Frame caption={caption} captionDark={captionDark} tilt={tilt} size={size}>
      <Screen />
    </Frame>
  )
}
