import { useEffect, useRef, useState } from 'react'
import { ConfigProvider } from './ConfigContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Problem from './components/Problem'
import { RiderFeatures, HostFeatures } from './components/Features'
import HostRegistration from './components/HostRegistration'
import HowItWorks from './components/HowItWorks'
import Gallery from './components/Gallery'
import Trust from './components/Trust'
import Download from './components/Download'
import ValetEnquiry from './components/ValetEnquiry'
import Contact from './components/Contact'
import Footer from './components/Footer'
import StickyActions from './components/StickyActions'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import { api, hasBackend } from './api'
import { endSession, readSession } from './auth'
import { useHeaderSolid, useScrollReveal } from './hooks'

const isAdminHash = (hash) =>
  hash === '#admin' || hash.startsWith('#admin-reset=')

/** The admin panel opens on #admin and stays in sync with the address bar,
 *  so it survives a refresh and can be closed with the back button. */
function useAdminRoute() {
  const [route, setRoute] = useState(
    () =>
      typeof window !== 'undefined' && isAdminHash(window.location.hash)
        ? window.location.hash
        : '',
  )

  useEffect(() => {
    const onHash = () =>
      setRoute(isAdminHash(window.location.hash) ? window.location.hash : '')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const close = () => {
    if (isAdminHash(window.location.hash)) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    setRoute('')
  }

  return [Boolean(route), route.startsWith('#admin-reset='), close]
}

function Site() {
  const heroRef = useRef(null)
  const headerSolid = useHeaderSolid()
  const [adminOpen, resettingPassword, closeAdmin] = useAdminRoute()
  const [authed, setAuthed] = useState(() =>
    hasBackend ? false : readSession(),
  )
  const [authReady, setAuthReady] = useState(() => !hasBackend)

  useScrollReveal()

  // A backend session lives in an httpOnly cookie, so only the server can
  // confirm it. Restore that session on refresh before showing the login form.
  useEffect(() => {
    if (!hasBackend) return undefined
    let cancelled = false
    api
      .me()
      .then(() => {
        if (!cancelled) setAuthed(true)
      })
      .catch(() => {
        if (!cancelled) setAuthed(false)
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function signOut() {
    try {
      if (hasBackend) await api.logout()
    } finally {
      endSession()
      setAuthed(false)
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header solid={headerSolid} />

      <main id="main">
        {/* Fold 1 */} <Hero ref={heroRef} />
        {/* Fold 2 */} <Problem />
        {/* Fold 3 */} <RiderFeatures />
        {/* Fold 4 */} <HostFeatures />
        <HostRegistration />
        {/* Fold 5 */} <HowItWorks />
        {/* Fold 6 */} <Gallery />
        {/* Fold 7 */} <Trust />
        {/* Fold 8 */} <Download />
        <ValetEnquiry />
        {/* Fold 9 */} <Contact />
      </main>

      <Footer />
      <StickyActions />

      {adminOpen && resettingPassword ? (
        <AdminLogin
          key="reset"
          onSuccess={() => setAuthed(true)}
          onClose={closeAdmin}
        />
      ) : adminOpen && authReady ? (
        authed ? (
          <AdminPanel
            onClose={closeAdmin}
            onSignOut={signOut}
          />
        ) : (
          <AdminLogin
            key="signin"
            onSuccess={() => setAuthed(true)}
            onClose={closeAdmin}
          />
        )
      ) : null}
    </>
  )
}

export default function App() {
  return (
    <ConfigProvider>
      <Site />
    </ConfigProvider>
  )
}
