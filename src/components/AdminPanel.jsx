import { useEffect, useRef, useState } from 'react'
import { useConfigAdmin } from '../ConfigContext'
import { hashCredentials } from '../auth'
import { api, hasBackend } from '../api'

/**
 * Admin panel. Open the site with #admin in the URL to reveal it.
 *
 * WHAT IT DOES: edits the live site instantly, and saves to this browser so
 * the changes survive a refresh on this device.
 *
 * WHAT IT CANNOT DO: a static site has no server, so "Save" is local to the
 * browser you're using — visitors won't see it. To publish a change for
 * everyone, hit "Download config" and either paste the values into
 * src/config.js and redeploy, or wire the app to a CMS (see the README).
 */

function Text({ label, value, onChange, placeholder, hint, type = 'text' }) {
  return (
    <label className="ap__field">
      <span className="ap__label">{label}</span>
      <input
        className="ap__input"
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="ap__hint">{hint}</span> : null}
    </label>
  )
}

function Color({ label, value, onChange }) {
  return (
    <label className="ap__field ap__field--color">
      <span className="ap__label">{label}</span>
      <span className="ap__colorRow">
        <input
          className="ap__swatch"
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour picker`}
        />
        <input
          className="ap__input ap__input--hex"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck="false"
        />
      </span>
    </label>
  )
}

/** Upload control: picks a file, sends it to the server, writes the returned
 *  URL straight into the config field it belongs to. */
function Upload({ accept, onUploaded }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function handle(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setErr('')
    setBusy(true)
    try {
      const { url } = await api.upload(file)
      onUploaded(url)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!hasBackend) {
    return (
      <p className="ap__hint">
        Uploads need the backend running. Paste a URL instead, or set VITE_API_URL.
      </p>
    )
  }

  return (
    <>
      <button
        className="btn btn--ghost ap__upload"
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
      >
        {busy ? 'Uploading…' : 'Upload a file'}
      </button>
      <input
        ref={ref}
        className="visually-hidden"
        type="file"
        accept={accept}
        onChange={handle}
      />
      {err ? <p className="ap__error">{err}</p> : null}
    </>
  )
}

const TABS = [
  ['brand', 'Brand'],
  ['colors', 'Colours'],
  ['contact', 'Contact'],
  ['links', 'Links'],
  ['media', 'Photos & video'],
  ['security', 'Security'],
]

/** Generates the hash to paste into src/config.js when changing the password.
 *  The password itself is never stored anywhere — only its hash. */
function ServerSecurityTab() {
  const [email, setEmail] = useState('')
  const [emailPw, setEmailPw] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function run(fn) {
    setMsg('')
    setErr('')
    try {
      await fn()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <>
      <p className="ap__note">
        Changing either credential asks for your current password first, so a
        left-open session can&rsquo;t be used to lock you out.
      </p>

      <div className="ap__pair">
        <p className="ap__label">Change email (your user ID)</p>
        <Text label="New email" value={email} onChange={setEmail} />
        <label className="ap__field">
          <span className="ap__label">Current password</span>
          <input
            className="ap__input"
            type="password"
            value={emailPw}
            onChange={(e) => setEmailPw(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() =>
            run(async () => {
              await api.changeEmail(email, emailPw)
              setMsg('Email updated. Use it to sign in from now on.')
              setEmail('')
              setEmailPw('')
            })
          }
        >
          Update email
        </button>
      </div>

      <div className="ap__pair">
        <p className="ap__label">Change password</p>
        {[
          ['Current password', current, setCurrent, 'current-password'],
          ['New password', next, setNext, 'new-password'],
          ['Confirm new password', confirm, setConfirm, 'new-password'],
        ].map(([label, value, setter, complete]) => (
          <label className="ap__field" key={label}>
            <span className="ap__label">{label}</span>
            <input
              className="ap__input"
              type="password"
              value={value}
              onChange={(e) => setter(e.target.value)}
              autoComplete={complete}
            />
          </label>
        ))}
        <span className="ap__hint">
          At least 10 characters, with a letter and a number.
        </span>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() =>
            run(async () => {
              if (next !== confirm) throw new Error("The two passwords don't match.")
              await api.changePassword(current, next)
              setMsg('Password changed.')
              setCurrent('')
              setNext('')
              setConfirm('')
            })
          }
        >
          Update password
        </button>
      </div>

      {err ? <p className="ap__error">{err}</p> : null}
      {msg ? <p className="ap__flash">{msg}</p> : null}
    </>
  )
}

function SecurityTab({ username, update }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [hash, setHash] = useState('')
  const [err, setErr] = useState('')

  async function generate() {
    setErr('')
    setHash('')
    if (pw.length < 10) {
      setErr('Use at least 10 characters.')
      return
    }
    if (pw !== pw2) {
      setErr("The two passwords don't match.")
      return
    }
    try {
      setHash(await hashCredentials(username, pw))
    } catch (e) {
      setErr(
        e?.code === 'insecure-context'
          ? 'Hashing needs https:// or localhost.'
          : 'Could not generate the hash.',
      )
    }
  }

  return (
    <>
      <Text
        label="User ID"
        value={username}
        onChange={(v) => update('admin.username', v)}
      />

      <label className="ap__field">
        <span className="ap__label">New password</span>
        <input
          className="ap__input"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
        />
        <span className="ap__hint">At least 10 characters.</span>
      </label>

      <label className="ap__field">
        <span className="ap__label">Confirm password</span>
        <input
          className="ap__input"
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          autoComplete="new-password"
        />
      </label>

      {err ? <p className="ap__error">{err}</p> : null}

      <button className="btn btn--primary" type="button" onClick={generate}>
        Generate hash
      </button>

      {hash ? (
        <div className="ap__pair">
          <p className="ap__label">Paste this into src/config.js, then redeploy:</p>
          <code className="ap__code">passwordHash: '{hash}',</code>
        </div>
      ) : null}

      <p className="ap__note ap__note--warn">
        <strong>Sign-in here is a deterrent, not real security.</strong> The check
        runs in the browser, so anyone reading the page source can work around it.
        That's acceptable while this panel publishes nothing. If you connect saving
        to a server or CMS, move authentication to the server first.
      </p>
    </>
  )
}

export default function AdminPanel({ onClose, onSignOut }) {
  const { config, update, replace, save, reset } = useConfigAdmin()
  const [tab, setTab] = useState('brand')
  const [note, setNote] = useState('')
  const fileRef = useRef(null)

  // Escape closes the panel.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function flash(message) {
    setNote(message)
    window.setTimeout(() => setNote(''), 3200)
  }

  async function handleSave() {
    const result = await save()
    flash(result.message)
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'igloo-site-config.json'
    a.click()
    URL.revokeObjectURL(url)
    flash('Downloaded. Hand this to your developer, or import it on another device.')
  }

  function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replace(JSON.parse(String(reader.result)))
        flash('Config imported.')
      } catch {
        flash("That file isn't valid JSON.")
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div className="ap" role="dialog" aria-label="Site admin panel">
      <header className="ap__head">
        <div>
          <p className="ap__eyebrow">Admin</p>
          <h2 className="ap__title">Site settings</h2>
        </div>
        <div className="ap__headActions">
          <button className="ap__close" type="button" onClick={onSignOut}>
            Sign out
          </button>
          <button className="ap__close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      <nav className="ap__tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`ap__tab${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="ap__body">
        {tab === 'brand' && (
          <>
            <Text
              label="Business name"
              value={config.brand.name}
              onChange={(v) => update('brand.name', v)}
            />
            <Text
              label="Name suffix"
              value={config.brand.suffix}
              onChange={(v) => update('brand.suffix', v)}
              hint="Shown in a lighter weight after the name"
            />
            <Text
              label="Tagline"
              value={config.brand.tagline}
              onChange={(v) => update('brand.tagline', v)}
            />
          </>
        )}

        {tab === 'colors' && (
          <>
            <Color
              label="Primary (buttons & links)"
              value={config.colors.primary}
              onChange={(v) => update('colors.primary', v)}
            />
            <Color
              label="Primary — hover"
              value={config.colors.deep}
              onChange={(v) => update('colors.deep', v)}
            />
            <Color
              label="Gradient start"
              value={config.colors.gradientFrom}
              onChange={(v) => update('colors.gradientFrom', v)}
            />
            <Color
              label="Gradient end"
              value={config.colors.gradientTo}
              onChange={(v) => update('colors.gradientTo', v)}
            />
            <Color
              label="Host accent (the warm one)"
              value={config.colors.host}
              onChange={(v) => update('colors.host', v)}
            />
            <Color
              label="Text colour"
              value={config.colors.ink}
              onChange={(v) => update('colors.ink', v)}
            />
            <p className="ap__note">
              Keep buttons dark enough that white text stays readable on them —
              aim for a contrast ratio of at least 4.5:1.
            </p>
          </>
        )}

        {tab === 'contact' && (
          <>
            <Text
              label="WhatsApp number"
              value={config.contact.whatsappNumber}
              onChange={(v) => update('contact.whatsappNumber', v.replace(/\D/g, ''))}
              hint="Digits only, including country code — e.g. 919972630567"
            />
            <Text
              label="WhatsApp number (as displayed)"
              value={config.contact.whatsappDisplay}
              onChange={(v) => update('contact.whatsappDisplay', v)}
            />
            <Text
              label="Email address"
              type="email"
              value={config.contact.email}
              onChange={(v) => update('contact.email', v)}
              hint="Where the contact form sends enquiries"
            />
            <Text
              label="Instagram URL"
              value={config.contact.instagram}
              onChange={(v) => update('contact.instagram', v)}
            />
          </>
        )}

        {tab === 'links' && (
          <>
            <Text
              label="App Store URL"
              value={config.links.appStore}
              onChange={(v) => update('links.appStore', v)}
            />
            <Text
              label="Play Store URL"
              value={config.links.playStore}
              onChange={(v) => update('links.playStore', v)}
              hint="Leave empty and the page shows “Android — coming soon” instead"
            />
            <Text
              label="Form endpoint"
              value={config.links.formEndpoint}
              onChange={(v) => update('links.formEndpoint', v)}
              hint="Optional Formspree / FormSubmit URL. Empty = opens the visitor's mail app"
            />
            {config.footerLinks.map((link, i) => (
              <div className="ap__pair" key={i}>
                <Text
                  label={`Footer link ${i + 1} — label`}
                  value={link.label}
                  onChange={(v) => update(`footerLinks.${i}.label`, v)}
                />
                <Text
                  label="URL"
                  value={link.href}
                  onChange={(v) => update(`footerLinks.${i}.href`, v)}
                />
              </div>
            ))}
          </>
        )}

        {tab === 'security' &&
          (hasBackend ? (
            <ServerSecurityTab />
          ) : (
            <SecurityTab username={config.admin.username} update={update} />
          ))}

        {tab === 'media' && (
          <>
            <Text
              label="Section heading"
              value={config.media.galleryTitle}
              onChange={(v) => update('media.galleryTitle', v)}
            />
            <Text
              label="Section subheading"
              value={config.media.gallerySubtitle}
              onChange={(v) => update('media.gallerySubtitle', v)}
            />

            <p className="ap__note">
              Upload a photo, or paste a URL if it's already hosted elsewhere.
              Landscape shots around 1200×900 work best. Empty slots show a
              labelled placeholder rather than a broken image.
            </p>

            {config.media.images.map((img, i) => (
              <div className="ap__pair" key={i}>
                <Text
                  label={`Photo ${i + 1} — image URL`}
                  value={img.src}
                  onChange={(v) => update(`media.images.${i}.src`, v)}
                  placeholder="https://…/space.jpg"
                />
                <Upload
                  accept="image/jpeg,image/png,image/webp"
                  onUploaded={(url) => update(`media.images.${i}.src`, url)}
                />
                <Text
                  label="Caption"
                  value={img.caption}
                  onChange={(v) => update(`media.images.${i}.caption`, v)}
                />
                <Text
                  label="Alt text (for screen readers)"
                  value={img.alt}
                  onChange={(v) => update(`media.images.${i}.alt`, v)}
                />
              </div>
            ))}

            <div className="ap__pair">
              <Text
                label="Video URL (.mp4)"
                value={config.media.video.src}
                onChange={(v) => update('media.video.src', v)}
                placeholder="https://…/tour.mp4"
              />
              <Upload
                accept="video/mp4,video/webm"
                onUploaded={(url) => update('media.video.src', url)}
              />
              <Text
                label="Video poster image"
                value={config.media.video.poster}
                onChange={(v) => update('media.video.poster', v)}
                hint="Shown before playback starts — keeps mobile data use down"
              />
              <Upload
                accept="image/jpeg,image/png,image/webp"
                onUploaded={(url) => update('media.video.poster', url)}
              />
              <Text
                label="Video caption"
                value={config.media.video.caption}
                onChange={(v) => update('media.video.caption', v)}
              />
            </div>
          </>
        )}
      </div>

      <footer className="ap__foot">
        {note ? <p className="ap__flash">{note}</p> : null}
        <div className="ap__actions">
          <button className="btn btn--primary" type="button" onClick={handleSave}>
            {hasBackend ? 'Publish changes' : 'Save to this browser'}
          </button>
          <button className="btn btn--ghost" type="button" onClick={handleDownload}>
            Download config
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>
          <button
            className="btn btn--ghost ap__reset"
            type="button"
            onClick={() => {
              reset()
              flash('Reset to the shipped defaults.')
            }}
          >
            Reset
          </button>
          <input
            ref={fileRef}
            className="visually-hidden"
            type="file"
            accept="application/json"
            onChange={handleImport}
          />
        </div>
      </footer>
    </div>
  )
}
