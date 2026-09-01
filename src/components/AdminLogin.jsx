import { useEffect, useRef, useState } from 'react'
import { useSite } from '../ConfigContext'
import { api, hasBackend } from '../api'
import { startSession, verifyCredentials } from '../auth'

/**
 * Admin sign-in.
 *
 * With a backend connected (NEXT_PUBLIC_API_URL set), this is real authentication:
 * the server checks a bcrypt hash and issues an httpOnly session cookie, and
 * password reset by email works.
 *
 * Without a backend it falls back to a browser-only check, which is a
 * deterrent rather than security — the panel says so plainly.
 */

const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 60

export default function AdminLogin({ onSuccess, onClose }) {
  const { admin } = useSite()
  const [mode, setMode] = useState(() =>
    window.location.hash.startsWith('#admin-reset=') ? 'reset' : 'signin',
  )
  const [resetToken] = useState(() =>
    window.location.hash.startsWith('#admin-reset=')
      ? window.location.hash.slice('#admin-reset='.length)
      : '',
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const firstRef = useRef(null)

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!lockedUntil) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [lockedUntil])

  const locked = lockedUntil > now
  const secondsLeft = Math.ceil((lockedUntil - now) / 1000)

  function clearMessages() {
    setError('')
    setNotice('')
  }

  async function signIn(event) {
    event.preventDefault()
    if (locked || busy) return
    if (!email.trim() || !password) {
      setError('Enter both your email and password.')
      return
    }

    setBusy(true)
    try {
      if (hasBackend) {
        await api.login(email.trim(), password)
        onSuccess()
        return
      }
      const ok = await verifyCredentials(email, password, admin)
      if (ok) {
        startSession()
        onSuccess()
        return
      }
      throw new Error('Incorrect email or password.')
    } catch (err) {
      const next = attempts + 1
      setAttempts(next)
      setPassword('')
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCK_SECONDS * 1000)
        setNow(Date.now())
        setAttempts(0)
        setError(`Too many attempts. Locked for ${LOCK_SECONDS} seconds.`)
      } else {
        setError(
          `${err.message || 'Sign-in failed.'} ${MAX_ATTEMPTS - next} attempt${
            MAX_ATTEMPTS - next === 1 ? '' : 's'
          } left.`,
        )
      }
    } finally {
      setBusy(false)
    }
  }

  async function requestReset(event) {
    event.preventDefault()
    clearMessages()
    if (!email.trim()) {
      setError('Enter the email address on your admin account.')
      return
    }
    setBusy(true)
    try {
      const res = await api.forgot(email.trim())
      setNotice(res?.message || 'If that email has an account, a reset link is on its way.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function applyReset(event) {
    event.preventDefault()
    clearMessages()
    if (password !== confirm) {
      setError("The two passwords don't match.")
      return
    }
    setBusy(true)
    try {
      await api.reset(resetToken, password)
      setNotice('Password changed. You can sign in with it now.')
      setMode('signin')
      setPassword('')
      setConfirm('')
      window.history.replaceState(null, '', `${window.location.pathname}#admin`)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    signin: 'Sign in',
    forgot: 'Reset your password',
    reset: 'Choose a new password',
  }

  return (
    <div className="ap ap--login" role="dialog" aria-label="Admin sign in">
      <header className="ap__head">
        <div>
          <p className="ap__eyebrow">Admin</p>
          <h2 className="ap__title">{titles[mode]}</h2>
        </div>
        <button className="ap__close" type="button" onClick={onClose}>
          Close
        </button>
      </header>

      {mode === 'signin' && (
        <form className="ap__body ap__login" onSubmit={signIn} noValidate>
          <label className="ap__field">
            <span className="ap__label">Email</span>
            <input
              ref={firstRef}
              className="ap__input"
              type="email"
              name="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearMessages()
              }}
              disabled={locked}
            />
          </label>

          <label className="ap__field">
            <span className="ap__label">Password</span>
            <input
              className="ap__input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearMessages()
              }}
              disabled={locked}
            />
          </label>

          <div aria-live="polite">
            {error ? (
              <p className="ap__error">
                {locked ? `Too many attempts. Try again in ${secondsLeft}s.` : error}
              </p>
            ) : null}
            {notice ? <p className="ap__flash">{notice}</p> : null}
          </div>

          <button
            className="btn btn--primary btn--block"
            type="submit"
            disabled={busy || locked}
          >
            {busy ? 'Checking…' : 'Sign in'}
          </button>

          {hasBackend ? (
            <button
              className="ap__linkBtn"
              type="button"
              onClick={() => {
                setMode('forgot')
                clearMessages()
              }}
            >
              Forgot your password?
            </button>
          ) : (
            <p className="ap__note ap__note--warn">
              <strong>Local preview mode — this gate is not real security.</strong>{' '}
              No backend is connected, so the password is checked in the browser and
              can be bypassed. Changes save to this device only. Set{' '}
              <code>NEXT_PUBLIC_API_URL</code> to enable real sign-in, password reset by
              email, and uploads.
            </p>
          )}
        </form>
      )}

      {mode === 'forgot' && (
        <form className="ap__body ap__login" onSubmit={requestReset} noValidate>
          <p className="ap__note">
            Enter your admin email and we&rsquo;ll send a reset link. It works once
            and expires after 30 minutes.
          </p>

          <label className="ap__field">
            <span className="ap__label">Email</span>
            <input
              className="ap__input"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearMessages()
              }}
            />
          </label>

          <div aria-live="polite">
            {error ? <p className="ap__error">{error}</p> : null}
            {notice ? <p className="ap__flash">{notice}</p> : null}
          </div>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          <button
            className="ap__linkBtn"
            type="button"
            onClick={() => {
              setMode('signin')
              clearMessages()
            }}
          >
            Back to sign in
          </button>
        </form>
      )}

      {mode === 'reset' && (
        <form className="ap__body ap__login" onSubmit={applyReset} noValidate>
          <label className="ap__field">
            <span className="ap__label">New password</span>
            <input
              ref={firstRef}
              className="ap__input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearMessages()
              }}
            />
            <span className="ap__hint">
              At least 10 characters, with a letter and a number.
            </span>
          </label>

          <label className="ap__field">
            <span className="ap__label">Confirm new password</span>
            <input
              className="ap__input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                clearMessages()
              }}
            />
          </label>

          <div aria-live="polite">
            {error ? <p className="ap__error">{error}</p> : null}
            {notice ? <p className="ap__flash">{notice}</p> : null}
          </div>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      )}
    </div>
  )
}
