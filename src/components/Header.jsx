import Logo from './Logo'

export default function Header({ solid }) {
  return (
    <header className={`header${solid ? ' is-solid' : ' on-dark'}`}>
      <div className="shell header__inner">
        <Logo light={!solid} />
        <nav className="header__nav" aria-label="Primary">
          <a className="header__link" href="#riders">
            For riders
          </a>
          <a className="header__link" href="#hosts">
            For hosts
          </a>
          <a className="header__link" href="#how">
            How it works
          </a>
          <a className="header__link" href="#valet">
            Valet
          </a>
          <a className="header__link" href="#contact">
            Contact
          </a>
        </nav>
      </div>
    </header>
  )
}
