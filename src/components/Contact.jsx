import { useState } from 'react'
import {
  ArrowIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  WhatsAppIcon,
} from './Icons'
import { WA_MESSAGES, waLink } from '../config'
import { api } from '../api'
import { useSite } from '../ConfigContext'

const EMPTY = { name: '', email: '', phone: '', message: '', contactCheck: '' }

export default function Contact() {
  const { contact } = useSite()
  const [values, setValues] = useState(EMPTY)
  const [invalid, setInvalid] = useState([])
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorText, setErrorText] = useState('')

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    setInvalid((prev) => prev.filter((f) => f !== field))
    if (status === 'error') setStatus('idle')
  }

  function validate() {
    const missing = []
    if (!values.name.trim()) missing.push('name')
    if (!values.email.trim()) missing.push('email')
    if (!values.message.trim()) missing.push('message')

    if (missing.length) {
      setErrorText('Please fill in all required fields.')
      return missing
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
      setErrorText('That email address doesn\u2019t look right. Check it and try again.')
      return ['email']
    }

    return []
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const problems = validate()
    if (problems.length) {
      setInvalid(problems)
      setStatus('error')
      return
    }

    setInvalid([])

    setStatus('sending')
    try {
      await api.submitContact(values)
      setStatus('sent')
      setValues(EMPTY)
    } catch {
      setErrorText(
        `We couldn\u2019t send that. Please email us at ${contact.email} or message us on WhatsApp.`,
      )
      setStatus('error')
    }
  }

  return (
    <section className="fold contact" id="contact">
      <div className="shell">
        <div className="contact__head reveal">
          <p className="eyebrow">Contact</p>
          <h2 className="h-section">Questions? We&rsquo;re here.</h2>
          <p className="lede contact__sub">
            For support, partnerships, or feedback — reach out and we&rsquo;ll get back
            to you within 24 hours.
          </p>
        </div>

        <div className="contact__layout">
          <form className="form reveal" onSubmit={handleSubmit} noValidate>
            <div className="form__grid">
              <div className="field">
                <label className="field__label" htmlFor="cf-name">
                  Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="cf-name"
                  className={`field__input${invalid.includes('name') ? ' is-invalid' : ''}`}
                  type="text"
                  name="name"
                  placeholder="Your name"
                  autoComplete="name"
                  value={values.name}
                  onChange={update('name')}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="cf-email">
                  Email <span aria-hidden="true">*</span>
                </label>
                <input
                  id="cf-email"
                  className={`field__input${invalid.includes('email') ? ' is-invalid' : ''}`}
                  type="email"
                  name="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={values.email}
                  onChange={update('email')}
                  required
                />
              </div>

              <div className="field field--full">
                <label className="field__label" htmlFor="cf-phone">
                  Phone (optional)
                </label>
                <input
                  id="cf-phone"
                  className="field__input"
                  type="tel"
                  name="phone"
                  placeholder="Your phone number"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={update('phone')}
                />
              </div>

              <div className="field field--full">
                <label className="field__label" htmlFor="cf-message">
                  Message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="cf-message"
                  className={`field__textarea${invalid.includes('message') ? ' is-invalid' : ''}`}
                  name="message"
                  placeholder="How can we help?"
                  value={values.message}
                  onChange={update('message')}
                  required
                />
              </div>
            </div>

            {/* Spam trap — hidden from people, tempting to bots. */}
            <input
              className="visually-hidden"
              type="text"
              name="contact_check"
              tabIndex={-1}
              autoComplete="new-password"
              value={values.contactCheck}
              onChange={update('contactCheck')}
              aria-hidden="true"
            />

            <div className="form__foot">
              <button
                className="btn btn--primary"
                type="submit"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Send Message'}
              </button>
              <p className="form__note">
                Goes straight to {contact.email}
              </p>
            </div>

            <div aria-live="polite">
              {status === 'sent' && (
                <p className="form__msg form__msg--ok">
                  Thanks! We&rsquo;ve received your message and will get back to you
                  shortly.
                </p>
              )}
              {status === 'error' && (
                <p className="form__msg form__msg--err">{errorText}</p>
              )}
            </div>
          </form>

          <aside className="wa-card reveal on-dark">
            <p className="wa-card__divider">Or reach us directly</p>
            <h3 className="wa-card__title">Chat on WhatsApp</h3>
            <p className="wa-card__body">
              Quickest way to get an answer. Message us and a real person replies —
              usually the same day.
            </p>

            <a
              className="btn btn--wa wa-card__btn btn--block"
              href={waLink(contact.whatsappNumber, WA_MESSAGES.moreInfo)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon size={20} /> Chat on WhatsApp
            </a>

            <ul className="wa-card__list">
              <li>
                <a className="wa-card__item" href={`mailto:${contact.email}`}>
                  <MailIcon /> {contact.email}
                </a>
              </li>
              <li>
                <a
                  className="wa-card__item"
                  href={`tel:+${contact.whatsappDisplay.replace(/\D/g, '')}`}
                >
                  <PhoneIcon /> {contact.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  className="wa-card__item"
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon /> @iglooparking <ArrowIcon size={14} />
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
