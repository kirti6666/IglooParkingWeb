# Igloo Parking — landing page

A React single-page site built to the *Igloo Parking Landing Page Content Brief*
(25 July 2026). All nine folds are implemented with the exact copy from the brief.

---

## Run it

**Just want to look at it?** Open `preview.html` by double-clicking. It's the
whole site bundled into one file — no install, no server.

**To develop:**

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production files land in dist/
```

Deploy by dragging the `dist/` folder onto Netlify, Vercel, Cloudflare Pages,
or any static host.

---

## Admin panel

**How to open it:** add `#admin` to the end of the URL.

- Development: `http://localhost:5173/#admin`
- Live site: `https://yoursite.com/#admin`

A sign-in screen appears. With the backend running, sign in with the email and
password from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Forgot it? Use **Forgot your
password?** and a reset link is emailed to you.

Change your email or password any time from the **Security** tab — both ask for
your current password first.

Six tabs: Brand, Colours, Contact, Links, Photos & video, Security. Edits apply
to the page instantly as you type; **Publish changes** makes them live for
everyone. Five wrong sign-in attempts locks the form for 60 seconds.

### Two modes

The site runs in one of two modes depending on whether `VITE_API_URL` is set.

| | Local preview (no backend) | **Backend connected** |
| --- | --- | --- |
| Sign-in | Checked in the browser — **a deterrent, bypassable** | bcrypt on the server, httpOnly session cookie |
| Password reset by email | Not available | Yes, single-use link, 30-min expiry |
| Saving | This browser only | Published to every visitor |
| Uploads | Not available (paste URLs) | Yes, images and video |

Local preview is fine for design review. **Use the backend for anything real.**
The panel tells you which mode it's in.

## Backend

Lives in `server/`. Node 18+, no database — settings and the admin account sit
in a JSON file.

```bash
cd server
cp .env.example .env      # then fill it in — see below
npm install
npm start                 # http://localhost:4000
```

Then point the site at it, from the project root:

```bash
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev
```

### Can't sign in?

Work down this list — it's almost always one of these.

1. **Does the panel say "Local preview mode"?** Then `VITE_API_URL` isn't set. Create `.env` in the **project root** (not `server/`) with `VITE_API_URL=http://localhost:4000`, then **restart `npm run dev`** — Vite only reads `.env` at startup.
2. **Look at the server's terminal output on startup.** It prints the admin account's email, or a loud block explaining why no account exists.
3. **Changed `ADMIN_EMAIL`/`ADMIN_PASSWORD` after the first run?** Those are only read when the account is first created. Run `npm run reset-admin` in `server/` to overwrite it with the current `.env` values.
4. **Password rejected at seeding?** It needs 10+ characters including at least one letter and one number. The server says so at startup if it failed.

Completely stuck: stop the server, delete `server/data/db.json`, restart. That rebuilds the admin from `.env` — but it also wipes any settings you published.

### Filling in `.env`

| Variable | Notes |
| --- | --- |
| `JWT_SECRET` | 48+ random bytes. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeds the first admin on first boot only. Password needs 10+ chars with a letter and a number |
| `FRONTEND_ORIGIN` | Your site's URL. Used for CORS and to build reset links |
| `SMTP_*` | Any provider. **Leave `SMTP_HOST` empty in development** and reset links print to the server console instead of being emailed |

`.env`, `server/data/` and `server/uploads/` are gitignored. Never commit them.

### What protects it

- **bcrypt** at cost 12; passwords are never stored or logged in plaintext
- **httpOnly, sameSite=strict session cookie**, so page JavaScript — and any XSS — can't read the token
- **Origin checking** on every mutating request, a second lock against CSRF
- **Rate limits**: 10 sign-ins per 15 min, 5 reset requests per hour, 120 API calls per minute
- **Reset tokens** are random, stored only as a hash, single-use, 30-minute expiry
- **Identical replies** whether or not an email has an account, so the endpoint can't be used to discover addresses
- **Uploads** are checked three ways — extension, declared MIME type, and a magic-number sniff of the actual bytes. Filenames are generated, never taken from the client, so a crafted name can't escape the directory. 25 MB cap
- **Credential changes** require the current password, so an unattended session can't be used to lock you out
- `npm audit` reports **0 vulnerabilities**

### Before going live

1. Serve over **HTTPS** — the session cookie sets `secure` when `NODE_ENV=production`
2. Set `NODE_ENV=production`
3. Change `ADMIN_PASSWORD` from whatever seeded the account
4. Back up `server/data/db.json` and `server/uploads/` — that's your whole site content
5. Consider putting `/api/auth/*` behind a WAF or Cloudflare if the site gets traffic

## Photos and video

The Photos & video tab takes URLs, not uploads — there's nowhere to upload to
without a backend. Host the files somewhere (your web host, S3, Cloudinary) and
paste the links.

- **Photos:** four slots, landscape, roughly 1200×900. Empty slots show a
  labelled placeholder rather than a broken image.
- **Video:** an `.mp4` URL plus a poster image. Only metadata preloads until
  someone presses play, so mobile visitors don't burn data on a video they never
  watch. Always set a poster.

On mobile the gallery drops from four columns to two to one, images are
lazy-loaded, and every frame has a fixed aspect ratio so nothing jumps around as
photos arrive.

## Everything else lives in `src/config.js`

WhatsApp number, support email, Instagram, App Store link, Play Store link,
footer links, and the pre-filled WhatsApp messages are all in that one file.
Change them there and they update across the whole site.

Currently set:

`src/config.js` holds the shipped defaults that the admin panel edits.

| Setting | Value |
| --- | --- |
| WhatsApp | +91 99726 30567 |
| Email | support@iglooparking.com |
| App Store | apps.apple.com/in/app/igloo-parking |
| Instagram | @iglooparking |
| Play Store | *empty — see below* |

---

## Three things to finish before go-live

### 1. Contact form delivery

Right now the form validates, then opens the visitor's email app with everything
pre-filled and addressed to support@iglooparking.com. That works on any static
host with zero setup, but it does bounce people out to their mail client.

For a proper "submit and stay on the page" experience, create a free endpoint at
[Formspree](https://formspree.io), [FormSubmit](https://formsubmit.co), or
[Web3Forms](https://web3forms.com), then paste the URL into `FORM_ENDPOINT` in
`src/config.js`. The form switches to background submission automatically — no
other change needed.

The form already includes a hidden honeypot field to catch spam bots.

### 2. Apple's official App Store badge

The brief calls for Apple's official asset for guideline compliance. The badge
on the page right now is a close visual stand-in. Download the real one from
[Apple's marketing resources](https://developer.apple.com/app-store/marketing/guidelines/),
save it as `public/app-store-badge.svg`, then in
`src/components/Download.jsx` replace the `<a className="badge-store">` block
with:

```jsx
<a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
  <img src="/app-store-badge.svg" alt="Download on the App Store" height="56" />
</a>
```

### 3. App screenshots

The brief calls for the Welcome, Book Parking, Home map, Host Registration, and
OTP screens. Those weren't available, so all five phone mockups on the page are
**drawn in CSS to match the real app's design** — the Host Registration screen
in particular is a faithful rebuild of the screen you sent, right down to the
OTP toggle and the SAVE button.

When the real screenshots arrive, drop the PNGs into `public/screens/` and in
`src/components/PhoneMockup.jsx` swap the drawn screen for:

```jsx
<img src="/screens/host-registration.png" alt="" className="phone__shot" />
```

Add this to `src/styles.css`:

```css
.phone__shot { width: 100%; height: 100%; object-fit: cover; }
```

The frame, notch, shadow, and caption all stay as they are.

---

## What's on the page

| Fold | Section | Component |
| --- | --- | --- |
| — | Fixed header, visible from the top (transparent over the hero, solid past it) | `Header.jsx` |
| 1 | Hero — Park. Share. Earn. | `Hero.jsx` |
| 2 | Problem breather | `Problem.jsx` |
| 3 | Rider features | `Features.jsx` → `RiderFeatures` |
| 4 | Host features | `Features.jsx` → `HostFeatures` |
| 5 | How it works — 3 steps | `HowItWorks.jsx` |
| 6 | Trust & support strip | `Trust.jsx` |
| 7 | App download | `Download.jsx` |
| 8 | Contact form + WhatsApp card | `Contact.jsx` |
| 9 | Footer | `Footer.jsx` |
| — | Sticky WhatsApp button | `WhatsAppButton.jsx` |

## The two-audience colour split

Rider sections run cool (the app's blue-teal); host sections run warm — a deep
burnt orange `#B14A12` on a `#FFF7F1` background, carried through the eyebrow
pill, icon tiles, card hover and the CTA. Every pairing clears WCAG AA:

| Pairing | Ratio |
| --- | --- |
| Host eyebrow on its pill | 4.68:1 |
| Host accent on the warm fold | 5.14:1 |
| White on the host CTA | 5.44:1 |
| Rider eyebrow on its pill | 6.33:1 |

The obvious lighter oranges were rejected on measurement, not taste — terracotta
`#D97757` manages only 2.95:1 as body text and fails AA outright.

## Design notes

Colours come from the app itself — the blue-to-teal gradient, the pale blue
cards, the `#1782a6` SAVE-button blue, and the green toggle are all lifted from
the Host Registration screen. Type is Archivo for headings, Manrope for body,
and Space Mono for labels, prices, and codes — the monospace picks up the
meter-readout feel of parking.

Built to a quality floor: visible keyboard focus rings, a skip-to-content link,
`aria-live` on form messages, and `prefers-reduced-motion` honoured throughout.

## Manual changes you still need to make

Nothing below breaks the site — it runs as-is — but these are the real
to-dos before launch.

**Must do before going live**

1. `server/.env` — set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_ORIGIN`, and the `SMTP_*` block. Without SMTP, reset links only print to the server console.
2. Root `.env` — add `VITE_API_URL=https://your-api-url` or the site stays in local preview mode (no real login, no uploads).
3. Serve over **HTTPS** and set `NODE_ENV=production`, or the session cookie won't be marked `secure`.
4. Swap in Apple's official App Store badge — theirs is required by their guidelines. Download from [Apple's marketing resources](https://developer.apple.com/app-store/marketing/guidelines/) and replace the markup in `src/components/AppStoreBadge.jsx`.
5. Point the footer's **Terms of Use** and **Privacy Policy** at real pages (admin panel → Links, or `src/config.js`).

**Do when you have the content**

6. Add photos and video of parking spaces (admin panel → Photos & video). Placeholders show until then.
7. Replace the drawn phone mockups with real screenshots — see *Photos and video* below.
8. Add a Play Store URL once Android is live; the badge appears on its own.
9. Add `public/og-image.png` and re-add the `og:image` meta tag in `index.html` for link previews.

**Ongoing**

10. Back up `server/data/db.json` and `server/uploads/` — that's your entire site content.

## Responsive behaviour

Breakpoints at 980px, 800px, 760px, 560px and 380px, tested down to 320px.

| Width | What changes |
| --- | --- |
| ≤980px | Header nav hides, feature cards go single-column, contact form stacks above the WhatsApp card. Hero stays two-column with a 262px device |
| ≤800px | Hero stacks and centres; the phone mockup is hidden (see note below) |
| ≤760px | Steps go vertical; the three step phones become a swipeable snap-scroll row instead of ~1300px of stacked scrolling |
| ≤620px | Enquiry and WhatsApp become a fixed bottom action bar |
| ≤560px | Denser header, 18px gutters, copy rhythm tightens, WhatsApp button collapses to its icon |
| ≤380px | Wordmark shortens to "Igloo" so it can't crowd the CTA |

**The hero phone is hidden below 800px.** It pushed the mobile hero past 1000px
tall. To bring it back, delete the `.hero-phone` and `.hero__art` display rules
in the `max-width: 800px` block of `src/styles.css`.

Phone mockups are authored at a fixed 292×600 design size and scaled with a
`--phone-scale` custom property, so shrinking a frame shrinks its contents too
rather than clipping them. Tap targets are ≥44px, the WhatsApp button clears the
iOS home indicator via `env(safe-area-inset-bottom)`, and form inputs are 16px
so iOS doesn't zoom on focus.

## Android

`PLAY_STORE_URL` in `src/config.js` is deliberately empty. The page shows
"Android — coming soon" as text only, per the brief. Paste a Play Store URL in
there and the badge appears automatically while the text disappears — no other
edits needed.
