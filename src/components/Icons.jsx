/**
 * Inline SVG icons. All of them inherit `currentColor`, so colour is
 * controlled from CSS.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function MapPinIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

export function ClockIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3.1 1.9" />
    </svg>
  )
}

export function RupeeIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M7.5 5h9M7.5 9h9M16.5 5c0 2.8-2 4-4.5 4H7.5l7 10" />
    </svg>
  )
}

export function FormIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M19 12.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6.4" />
      <path d="M17.6 3.9a1.9 1.9 0 0 1 2.7 2.7L13.9 13l-3.4.7.7-3.4 6.4-6.4Z" />
    </svg>
  )
}

export function ToggleIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      <circle cx="16.5" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WalletIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11.5a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6a2.5 2.5 0 0 1-2.5-2.5v-8.5Z" />
      <path d="M3.5 9.2h16" />
      <circle cx="16" cy="14" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ShieldIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.4 2.9 7.7 7 9 4.1-1.3 7-4.6 7-9V6l-7-3Z" />
      <path d="m9.2 12 2 2 3.6-3.7" />
    </svg>
  )
}

export function FlagIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M6 21V4" />
      <path d="M6 4.8h9.6l-1.7 3.6 1.7 3.6H6" />
    </svg>
  )
}

export function HeadsetIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <path d="M4.5 13.5h1.8a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5.8A1.3 1.3 0 0 1 4.5 17.2v-3.7ZM19.5 13.5h-1.8a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h.5a1.3 1.3 0 0 0 1.3-1.3v-3.7Z" />
      <path d="M19.5 18v.6a2.4 2.4 0 0 1-2.4 2.4H13" />
    </svg>
  )
}

export function MailIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m3.8 7 7.1 5.3a2 2 0 0 0 2.2 0L20.2 7" />
    </svg>
  )
}

export function PhoneIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M6.2 3.5h2.6l1.4 3.6-1.9 1.4a11.5 11.5 0 0 0 5.2 5.2l1.4-1.9 3.6 1.4v2.6a2 2 0 0 1-2.2 2A15.6 15.6 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  )
}

export function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 2C6.6 2 2.17 6.43 2.17 11.87c0 1.9.5 3.72 1.45 5.33L2 22.5l5.44-1.58a9.83 9.83 0 0 0 4.6 1.15h.01c5.44 0 9.87-4.43 9.87-9.87S17.48 2 12.04 2Zm0 18.07h-.01a8.2 8.2 0 0 1-4.16-1.14l-.3-.18-3.1.9.83-3.02-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.52 3.68-8.2 8.2-8.2a8.2 8.2 0 0 1 0 16.31Zm4.5-6.14c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.55.12-.17.25-.64.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-1.98-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3c-.23.25-.86.85-.86 2.06s.88 2.39 1 2.55c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.19-.06-.1-.22-.16-.47-.28Z"
      />
    </svg>
  )
}

export function AppleIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.65c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.14.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.5ZM14.23 6.1c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.49 2.58-1.22Z"
      />
    </svg>
  )
}

export function PlayStoreIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5.2 3.4a1.4 1.4 0 0 0-.7 1.22v14.76a1.4 1.4 0 0 0 .7 1.22L14.9 12 5.2 3.4Zm10.92 7.52-2.43-1.46-6.3-5.58 8.73 7.04Zm-8.73 9.2 6.31-5.58 2.42-1.46-8.73 7.04Zm10.22-8.96L15.84 12l1.77.84 1.34-.8a.05.05 0 0 0 0-.08l-1.34-.8Z"
      />
    </svg>
  )
}

export function ArrowIcon({ size = 16 }) {
  return (
    <svg
      className="arrow-link__glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...base}
      aria-hidden="true"
    >
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  )
}
