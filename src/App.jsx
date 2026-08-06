import { useEffect, useRef, useState } from 'react'
import { ConfigProvider } from './ConfigContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Problem from './components/Problem'
import { RiderFeatures, HostFeatures } from './components/Features'
import HowItWorks from './components/HowItWorks'
import Gallery from './components/Gallery'
import Trust from './components/Trust'
import Download from './components/Download'
import Contact from './components/Contact'
import Footer from './components/Footer'
import StickyActions from './components/StickyActions'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import { endSession, readSession } from './auth'
import { useHeaderSolid, useScrollReveal } from './hooks'

/** The admin panel opens on #admin and stays in sync with the address bar,
 *  so it survives a refresh and can be closed with the back button. */
function useAdminRoute() {
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#admin',
  )

  useEffect(() => {
    const onHash = () => setOpen(window.location.hash === '#admin')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const close = () => {
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname)
    }
    setOpen(false)
  }

  return [open, close]
}

function Site() {
  const heroRef = useRef(null)
  const headerSolid = useHeaderSolid()
  const [adminOpen, closeAdmin] = useAdminRoute()
  const [authed, setAuthed] = useState(() => readSession())

  useScrollReveal()

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
        {/* Fold 5 */} <HowItWorks />
        {/* Fold 6 */} <Gallery />
        {/* Fold 7 */} <Trust />
        {/* Fold 8 */} <Download />
        {/* Fold 9 */} <Contact />
      </main>

      <Footer />
      <StickyActions />

      {adminOpen ? (
        authed ? (
          <AdminPanel
            onClose={closeAdmin}
            onSignOut={() => {
              endSession()
              setAuthed(false)
            }}
          />
        ) : (
          <AdminLogin onSuccess={() => setAuthed(true)} onClose={closeAdmin} />
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
