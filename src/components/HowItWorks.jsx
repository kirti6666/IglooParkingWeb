import PhoneMockup from './PhoneMockup'

const STEPS = [
  {
    num: '1',
    title: 'Register',
    body: 'Sign up as a rider or host in under a minute. Just your name, email, and phone number.',
  },
  {
    num: '2',
    title: 'Verify',
    body: 'Confirm with a quick OTP sent to your number. Secure, no passwords to remember.',
  },
  {
    num: '3',
    title: 'Park or List',
    body: 'Book a spot nearby, or list your own space and start earning.',
  },
]

export default function HowItWorks() {
  return (
    <section className="fold" id="how">
      <div className="shell">
        <div className="steps__head reveal">
          <p className="eyebrow">How it works</p>
          <h2 className="h-section steps__sub">Three steps. That&rsquo;s it.</h2>
        </div>

        <ol className="steps">
          {STEPS.map((step) => (
            <li className="step reveal" key={step.num}>
              <span className="step__num" aria-hidden="true">
                {step.num}
              </span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__body">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="steps__art">
          <div className="reveal">
            <PhoneMockup screen="host" caption="Registration" captionDark size={196} />
          </div>
          <div className="reveal">
            <PhoneMockup screen="otp" caption="OTP verification" captionDark size={196} />
          </div>
          <div className="reveal">
            <PhoneMockup screen="map" caption="Park or list" captionDark size={196} />
          </div>
        </div>
      </div>
    </section>
  )
}
