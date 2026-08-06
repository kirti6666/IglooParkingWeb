import Logo from './Logo'
import { InstagramIcon, MailIcon, WhatsAppIcon } from './Icons'
import { waLink, WA_MESSAGES } from '../config'
import { useSite } from '../ConfigContext'

export default function Footer() {
  const { brand, contact, footerLinks } = useSite()

  return (
    <footer className="footer on-dark">
      <div className="shell">
        <div className="footer__top">
          <div>
            <Logo light size={40} />
            <p className="footer__tagline">
              {brand.name} — {brand.tagline}
            </p>
          </div>

          <nav className="footer__links" aria-label="Footer">
            {footerLinks.map((link) => (
              <a className="footer__link" href={link.href} key={link.label}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>

          <div className="footer__socials">
            <a
              className="footer__social"
              href={waLink(contact.whatsappNumber, WA_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with ${brand.name} on WhatsApp`}
            >
              <WhatsAppIcon size={19} />
            </a>
            <a
              className="footer__social"
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${brand.name} on Instagram`}
            >
              <InstagramIcon size={19} />
            </a>
            <a
              className="footer__social"
              href={`mailto:${contact.email}`}
              aria-label={`Email ${brand.name} at ${contact.email}`}
            >
              <MailIcon size={19} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
