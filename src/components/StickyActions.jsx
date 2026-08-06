import { WhatsAppIcon } from './Icons'
import { waLink, WA_MESSAGES } from '../config'
import { useSite } from '../ConfigContext'

/**
 * The two persistent actions: send an enquiry, or chat on WhatsApp.
 *
 * On desktop they stack as floating buttons in the bottom-right corner.
 * On phones they become a fixed bottom bar — the reachable part of the screen,
 * and the standard place for primary actions on mobile. Body padding is added
 * to match so the bar never covers the footer.
 */
export default function StickyActions() {
  const { contact } = useSite()

  return (
    <div className="sticky">
      <a className="sticky__btn sticky__enquire" href="#contact">
        <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="5.5"
            width="18"
            height="13"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
          />
          <path
            d="m3.8 7 7.1 5.3a2 2 0 0 0 2.2 0L20.2 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
        <span>Send an enquiry</span>
      </a>

      <a
        className="sticky__btn sticky__wa"
        href={waLink(contact.whatsappNumber, WA_MESSAGES.general)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="sticky__pulse" aria-hidden="true" />
        <WhatsAppIcon size={21} />
        <span className="sticky__waLabel">Chat with us</span>
      </a>
    </div>
  )
}
