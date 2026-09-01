import { useState } from 'react'
import { api, hasBackend } from '../api'

const EMPTY = {
  businessName: '',
  contactName: '',
  mobile: '',
  email: '',
  addressLine1: '',
  location: '',
  city: '',
  pin: '',
  state: '',
  website: '',
}

const REQUIRED = [
  'businessName',
  'contactName',
  'mobile',
  'email',
  'addressLine1',
  'location',
  'city',
  'pin',
  'state',
]

function Field({ id, label, type = 'text', value, onChange, invalid, autoComplete, placeholder, full }) {
  return (
    <div className={`field${full ? ' field--full' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label} <span aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        className={`field__input${invalid ? ' is-invalid' : ''}`}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
    </div>
  )
}

export default function ValetEnquiry() {
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
    if (problems.length) return { problems, message: 'Please complete every required field.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
      return { problems: ['email'], message: 'Please enter a valid email address.' }
    }
    if (!/^\d{7,15}$/.test(values.mobile.replace(/\D/g, ''))) {
      return { problems: ['mobile'], message: 'Please enter a valid mobile number.' }
    }
    if (!/^\d{6}$/.test(values.pin.trim())) {
      return { problems: ['pin'], message: 'PIN code must contain 6 digits.' }
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
      setMessage('Online valet enquiries are temporarily unavailable. Please try again later.')
      setStatus('error')
      return
    }

    setInvalid([])
    setStatus('sending')
    try {
      await api.submitValet(values)
      setValues(EMPTY)
      setMessage('Thanks! Your valet parking request has been received.')
      setStatus('sent')
    } catch (error) {
      setMessage(error.message)
      setStatus('error')
    }
  }

  return (
    <section className="fold valet" id="valet">
      <div className="shell">
        <div className="valet__head reveal">
          <p className="eyebrow">Valet parking</p>
          <h2 className="h-section">Bring Igloo valet parking to your business.</h2>
          <p className="lede valet__sub">
            Tell us about your establishment and location. Our team will contact
            you to discuss the right valet setup.
          </p>
        </div>

        <form className="form valet__form reveal" onSubmit={submit} noValidate>
          <div className="form__grid">
            <Field id="valet-business" label="Business / establishment name" value={values.businessName} onChange={update('businessName')} invalid={invalid.includes('businessName')} autoComplete="organization" placeholder="Business name" />
            <Field id="valet-contact" label="Contact person name" value={values.contactName} onChange={update('contactName')} invalid={invalid.includes('contactName')} autoComplete="name" placeholder="Contact person" />
            <Field id="valet-mobile" label="Mobile number" type="tel" value={values.mobile} onChange={update('mobile')} invalid={invalid.includes('mobile')} autoComplete="tel" placeholder="Mobile number" />
            <Field id="valet-email" label="Email ID" type="email" value={values.email} onChange={update('email')} invalid={invalid.includes('email')} autoComplete="email" placeholder="name@business.com" />
            <Field id="valet-address" label="Address line 1" value={values.addressLine1} onChange={update('addressLine1')} invalid={invalid.includes('addressLine1')} autoComplete="address-line1" placeholder="Building and street address" full />
            <Field id="valet-location" label="Location / area" value={values.location} onChange={update('location')} invalid={invalid.includes('location')} autoComplete="address-line2" placeholder="Locality or landmark" />
            <Field id="valet-city" label="City" value={values.city} onChange={update('city')} invalid={invalid.includes('city')} autoComplete="address-level2" placeholder="City" />
            <Field id="valet-pin" label="PIN code" value={values.pin} onChange={update('pin')} invalid={invalid.includes('pin')} autoComplete="postal-code" placeholder="6-digit PIN" />
            <Field id="valet-state" label="State" value={values.state} onChange={update('state')} invalid={invalid.includes('state')} autoComplete="address-level1" placeholder="State" />
          </div>

          <input className="visually-hidden" type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} aria-hidden="true" />

          <div className="form__foot">
            <button className="btn btn--primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Submitting…' : 'Request valet parking'}
            </button>
            <p className="form__note">All fields are required.</p>
          </div>

          <div aria-live="polite">
            {status === 'sent' ? <p className="form__msg form__msg--ok">{message}</p> : null}
            {status === 'error' ? <p className="form__msg form__msg--err">{message}</p> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
