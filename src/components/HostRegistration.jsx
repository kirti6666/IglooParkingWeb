import { useState } from 'react'
import { MapPinIcon } from './Icons'
import { api, hasBackend } from '../api'
import { useSite } from '../ConfigContext'

const EMPTY = {
  name: '',
  building: '',
  street: '',
  pincode: '',
  location: '',
  mobile: '',
  email: '',
  otpRequired: true,
  website: '',
}

/** Building name is the one optional field on the app's registration screen. */
const REQUIRED = ['name', 'street', 'pincode', 'location', 'mobile', 'email']

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  invalid,
  autoComplete,
  placeholder,
  optional,
  icon,
  full,
}) {
  return (
    <div className={`field${full ? ' field--full' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label} {optional ? null : <span aria-hidden="true">*</span>}
      </label>
      <div className={`field__control${icon ? ' field__control--icon' : ''}`}>
        <input
          id={id}
          className={`field__input${invalid ? ' is-invalid' : ''}`}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={!optional}
        />
        {icon ? (
          <span className="field__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Host registration.
 *
 * Mirrors the registration screen in the Igloo Parking app so a host can sign
 * up from the website without installing anything first. Submissions land in
 * the encrypted database and are read back in the admin panel, the same route
 * valet enquiries take.
 */
export default function HostRegistration() {
  const { links } = useSite()
  const [values, setValues] = useState(EMPTY)
  const [invalid, setInvalid] = useState([])
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    setInvalid((prev) => prev.filter((item) => item !== field))
    if (status === 'error') setStatus('idle')
  }

  function validate() {
    const problems = REQUIRED.filter((field) => !values[field].trim())
    if (problems.length) {
      return { problems, message: 'Please complete every required field.' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
      return { problems: ['email'], message: 'Please enter a valid email address.' }
    }
    if (!/^\d{7,15}$/.test(values.mobile.replace(/\D/g, ''))) {
      return { problems: ['mobile'], message: 'Please enter a valid mobile number.' }
    }
    if (!/^\d{6}$/.test(values.pincode.trim())) {
      return { problems: ['pincode'], message: 'Pincode must contain 6 digits.' }
    }
    return { problems: [], message: '' }
  }

  async function submit(event) {
    event.preventDefault()
    if (values.website) return

    const result = validate()
    if (result.problems.length) {
      setInvalid(result.problems)
      setMessage(result.message)
      setStatus('error')
      return
    }
    if (!hasBackend) {
      setMessage('Online registration is temporarily unavailable. Please use the app.')
      setStatus('error')
      return
    }

    setInvalid([])
    setStatus('sending')
    try {
      await api.submitHostRegistration(values)
      setValues(EMPTY)
      setMessage("Thanks! Your space is registered. We'll be in touch shortly.")
      setStatus('sent')
    } catch (error) {
      setMessage(error.message)
      setStatus('error')
    }
  }

  return (
    <section className="fold host-register" id="host-registration">
      <div className="shell">
        <div className="host-register__head reveal">
          <p className="eyebrow eyebrow--host">Host registration</p>
          <h2 className="h-section host-register__title">
            Register your parking space.
          </h2>
          <p className="lede host-register__lede">
            It takes a couple of minutes. Add accurate details so riders can
            find and book your space with confidence.
          </p>
        </div>

        <form className="form host-register__form reveal" onSubmit={submit} noValidate>
          <div className="form__grid">
            <Field
              id="host-name"
              label="Your name"
              value={values.name}
              onChange={update('name')}
              invalid={invalid.includes('name')}
              autoComplete="name"
              placeholder="Full name"
            />
            <Field
              id="host-mobile"
              label="Mobile number"
              type="tel"
              value={values.mobile}
              onChange={update('mobile')}
              invalid={invalid.includes('mobile')}
              autoComplete="tel"
              placeholder="Mobile number"
            />
            <Field
              id="host-email"
              label="Email"
              type="email"
              value={values.email}
              onChange={update('email')}
              invalid={invalid.includes('email')}
              autoComplete="email"
              placeholder="name@example.com"
              full
            />
            <Field
              id="host-building"
              label="Building name"
              value={values.building}
              onChange={update('building')}
              autoComplete="address-line1"
              placeholder="Building name"
              optional
            />
            <Field
              id="host-street"
              label="Street name"
              value={values.street}
              onChange={update('street')}
              invalid={invalid.includes('street')}
              autoComplete="address-line2"
              placeholder="Street name"
            />
            <Field
              id="host-pincode"
              label="Pincode"
              value={values.pincode}
              onChange={update('pincode')}
              invalid={invalid.includes('pincode')}
              autoComplete="postal-code"
              placeholder="6-digit pincode"
            />
            <Field
              id="host-location"
              label="Parking place location"
              value={values.location}
              onChange={update('location')}
              invalid={invalid.includes('location')}
              placeholder="Locality or landmark"
              icon={<MapPinIcon size={20} />}
            />
          </div>

          <div className="host-register__toggle">
            <label className="switch" htmlFor="host-otp">
              <span className="switch__label">
                OTP authentication required for booking confirmation?
              </span>
              <input
                id="host-otp"
                className="switch__input"
                type="checkbox"
                checked={values.otpRequired}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, otpRequired: event.target.checked }))
                }
              />
              <span className="switch__track" aria-hidden="true">
                <span className="switch__thumb" />
              </span>
            </label>
          </div>

          <input
            className="visually-hidden"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={update('website')}
            aria-hidden="true"
          />

          <div className="form__foot">
            <button
              className="btn btn--primary host-register__save"
              type="submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Saving…' : 'Save'}
            </button>
            <p className="form__note">
              Building name is optional. Everything else is required.
            </p>
          </div>

          <div aria-live="polite">
            {status === 'sent' ? <p className="form__msg form__msg--ok">{message}</p> : null}
            {status === 'error' ? <p className="form__msg form__msg--err">{message}</p> : null}
          </div>
        </form>

        <p className="host-register__apps">
          Prefer the app?{' '}
          <a href={links.appStore} target="_blank" rel="noopener noreferrer">
            Register on iPhone
          </a>
          {links.playStore ? (
            <>
              {' '}or{' '}
              <a href={links.playStore} target="_blank" rel="noopener noreferrer">
                Register on Android
              </a>
            </>
          ) : null}
        </p>
      </div>
    </section>
  )
}
