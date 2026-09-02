import { useEffect, useState } from 'react'
import Logo from './Logo'

export default function Header({ solid }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const closeOnDesktop = () => {
      if (window.innerWidth > 980) setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeOnDesktop)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeOnDesktop)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`header${solid ? ' is-solid' : ' on-dark'}${menuOpen ? ' is-menu-open' : ''}`}>
      <div className="shell header__inner">
        <Logo light={!solid} />
        <button
          className="header__menu"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id="primary-navigation"
          className={`header__nav${menuOpen ? ' is-open' : ''}`}
          aria-label="Primary"
        >
          <a className="header__link" href="#riders" onClick={closeMenu}>
            For riders
          </a>
          <a className="header__link" href="#hosts" onClick={closeMenu}>
            For hosts
          </a>
          <a className="header__link" href="#how" onClick={closeMenu}>
            How it works
          </a>
          <a className="header__link" href="#valet" onClick={closeMenu}>
            Valet
          </a>
          <a className="header__link" href="#contact" onClick={closeMenu}>
            Contact
          </a>
        </nav>
      </div>
    </header>
  )
}
