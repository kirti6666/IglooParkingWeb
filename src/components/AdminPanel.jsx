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
      await onUploaded(url)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!hasBackend) {
    return (
      <p className="ap__hint">
        Uploads are temporarily unavailable. Paste a hosted URL instead.
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
  ['contact', 'Contact'],
  ['links', 'Links'],
  ['media', 'Photos & video'],
  ['valet', 'Valet enquiries'],
  ['security', 'Security'],
]

function ValetLeadsTab() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await api.getValetLeads()
      setLeads(result?.leads ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (!hasBackend) {
    return <p className="ap__note">Valet enquiries require the backend.</p>
  }

  return (
    <>
      <div className="ap__leadHead">
        <p className="ap__note">
          Newest enquiries appear first. Contact details are visible only to
          signed-in administrators.
        </p>
        <button className="btn btn--ghost" type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error ? <p className="ap__error">{error}</p> : null}
      {!loading && !error && leads.length === 0 ? (
        <p className="ap__note">No valet enquiries yet.</p>
      ) : null}

      {leads.map((lead) => (
        <article className="ap__lead" key={lead.id}>
          <div className="ap__leadTitle">
            <h3>{lead.businessName}</h3>
            <time dateTime={lead.submittedAt}>
              {new Date(lead.submittedAt).toLocaleString()}
            </time>
          </div>
          <dl>
            <div><dt>Contact</dt><dd>{lead.contactName}</dd></div>
            <div><dt>Mobile</dt><dd><a href={`tel:${lead.mobile}`}>{lead.mobile}</a></dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
            <div className="ap__leadWide"><dt>Address</dt><dd>{lead.addressLine1}, {lead.location}, {lead.city} — {lead.pin}, {lead.state}</dd></div>
          </dl>
        </article>
      ))}
    </>
  )
}

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
  const { config, update, replace, save, reset, saving } = useConfigAdmin()
  const [tab, setTab] = useState('brand')
  const [note, setNote] = useState('')

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

  function nextWith(path, value) {
    const next = JSON.parse(JSON.stringify(config))
    const keys = path.split('.')
    let node = next
    for (const key of keys.slice(0, -1)) node = node[key]
    node[keys.at(-1)] = value
    return next
  }

  async function publishUpload(path, url, label) {
    const previous = config
    const next = nextWith(path, url)
    replace(next)
    const result = await save(next)
    if (!result.ok) {
      replace(previous)
      await api.deleteMedia(url).catch(() => {})
      throw new Error(result.message)
    }
    flash(`${label} uploaded and published.`)
  }

  function addPhoto() {
    update('media.images', [
      ...(config.media.images ?? []),
      { src: '', caption: '', alt: '' },
    ])
  }

  function addVideo() {
    update('media.videos', [
      ...(config.media.videos ?? []),
      { src: '', poster: '', caption: '' },
    ])
  }

  async function deleteCard(type, index) {
    const label = type === 'images' ? 'photo' : 'video'
    if (!window.confirm(`Delete this ${label} card? This change will be published immediately.`)) {
      return
    }

    const previous = config
    const next = JSON.parse(JSON.stringify(config))
    const [removed] = next.media[type].splice(index, 1)
    replace(next)
    const result = await save(next)
    if (!result.ok) {
      replace(previous)
      flash(result.message)
      return
    }

    const managedUrls = type === 'images'
      ? [removed?.src]
      : [removed?.src, removed?.poster]
    await Promise.all(
      managedUrls.filter(Boolean).map((url) => api.deleteMedia(url).catch(() => false)),
    )
    flash(`${label[0].toUpperCase()}${label.slice(1)} deleted and published.`)
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'igloo-site-config.json'
    a.hidden = true
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Some browsers begin reading the Blob after the click handler returns.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    flash('Downloaded. Keep this backup or hand it to your developer.')
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

        {tab === 'valet' && <ValetLeadsTab />}

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
              Landscape shots around 1200×900 work best. Empty slots stay hidden
              from the public site until media is added.
            </p>

            {config.media.images.map((img, i) => (
              <div className="ap__pair" key={i}>
                <div className="ap__cardHead">
                  <strong>Photo {i + 1}</strong>
                  <button
                    className="ap__deleteBtn"
                    type="button"
                    onClick={() => deleteCard('images', i)}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </div>
                <Text
                  label="Image URL"
                  value={img.src}
                  onChange={(v) => update(`media.images.${i}.src`, v)}
                  placeholder="https://…/space.jpg"
                />
                <Upload
                  accept="image/jpeg,image/png,image/webp"
                  onUploaded={(url) =>
                    publishUpload(`media.images.${i}.src`, url, `Photo ${i + 1}`)
                  }
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

            <button className="btn btn--ghost ap__addBtn" type="button" onClick={addPhoto}>
              + Add photo
            </button>

            {(config.media.videos ?? []).map((video, i) => (
              <div className="ap__pair" key={i}>
                <div className="ap__cardHead">
                  <strong>Video {i + 1}</strong>
                  <button
                    className="ap__deleteBtn"
                    type="button"
                    onClick={() => deleteCard('videos', i)}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </div>
                <Text
                  label="Video URL (.mp4 or .webm)"
                  value={video.src}
                  onChange={(v) => update(`media.videos.${i}.src`, v)}
                  placeholder="https://…/tour.mp4"
                />
                <Upload
                  accept="video/mp4,video/webm"
                  onUploaded={(url) =>
                    publishUpload(`media.videos.${i}.src`, url, `Video ${i + 1}`)
                  }
                />
                <Text
                  label="Video poster image"
                  value={video.poster}
                  onChange={(v) => update(`media.videos.${i}.poster`, v)}
                  hint="Shown before playback starts — keeps mobile data use down"
                />
                <Upload
                  accept="image/jpeg,image/png,image/webp"
                  onUploaded={(url) =>
                    publishUpload(`media.videos.${i}.poster`, url, `Video ${i + 1} poster`)
                  }
                />
                <Text
                  label="Video caption"
                  value={video.caption}
                  onChange={(v) => update(`media.videos.${i}.caption`, v)}
                />
              </div>
            ))}

            <button className="btn btn--ghost ap__addBtn" type="button" onClick={addVideo}>
              + Add video
            </button>
          </>
        )}
      </div>

      <footer className="ap__foot">
        {note ? <p className="ap__flash">{note}</p> : null}
        {tab !== 'valet' ? <div className="ap__actions">
          <button className="btn btn--primary" type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Publishing…' : hasBackend ? 'Publish changes' : 'Save to this browser'}
          </button>
          <button className="btn btn--ghost" type="button" onClick={handleDownload}>
            Download config
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
        </div> : null}
      </footer>
    </div>
  )
}
