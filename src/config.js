/**
 * ---------------------------------------------------------------
 * IGLOO PARKING — default site configuration.
 *
 * This object is the shipped default. The admin panel (open the site
 * with #admin in the URL) edits a copy of it live, saves it to the
 * browser, and can export it as JSON.
 *
 * To make an edit permanent for every visitor: export the JSON from the
 * admin panel and paste the values back into this file, then redeploy.
 * ---------------------------------------------------------------
 */

export const defaultConfig = {
  brand: {
    name: 'Igloo',
    suffix: 'Parking',
    tagline: 'Park. Share. Earn.',
  },

  /* Theme colours. The admin panel writes these straight onto CSS
     custom properties, so changes apply across the whole site. */
  colors: {
    primary: '#1782a6', // buttons, links, rider accents
    deep: '#0b5b78', // hover / pressed states
    gradientFrom: '#4a9fd8', // hero + footer gradient start
    gradientTo: '#3fbfc4', // hero + footer gradient end
    host: '#b14a12', // the warm host-side accent
    ink: '#0a2230', // headings and body text
  },

  /* Admin sign-in. The password is stored only as a salted SHA-256 hash.
     Defaults are  admin / IglooAdmin@2026  — CHANGE THESE before go-live.
     Use the Security tab in the admin panel to generate a new hash, then
     paste it here and redeploy. */
  admin: {
    username: 'admin',
    passwordHash:
      '0ff72a3f19e1037126f4c4fd52a9384052aca50d639027434c110870001b87a9',
  },

  contact: {
    // Digits only, with country code — this is the wa.me format.
    whatsappNumber: '919972630567',
    whatsappDisplay: '+91 99726 30567',
    email: 'support@iglooparking.com',
    instagram: 'https://www.instagram.com/iglooparking?igsh=YW96bXE0YmhhYTg3',
  },

  links: {
    appStore: 'https://apps.apple.com/in/app/igloo-parking/id6759717457',
    // Leave empty until Android is live; the badge appears once it's set.
    playStore: '',
    // Optional: a form endpoint (Formspree / FormSubmit / Web3Forms).
    // Empty means the contact form falls back to the visitor's mail app.
    formEndpoint: '',
  },

  /* Photos and video of real parking spaces.
     Empty strings render a labelled placeholder instead of a broken image. */
  media: {
    galleryTitle: 'Real spaces, real spots.',
    gallerySubtitle:
      'Covered basements, quiet driveways, and lots with charging — every listing is a real space with a real host.',
    images: [
      { src: '', alt: 'Covered basement parking', caption: 'Covered basement' },
      { src: '', alt: 'Private driveway parking', caption: 'Private driveway' },
      { src: '', alt: 'Parking bay with EV charging', caption: 'EV charging bay' },
      { src: '', alt: 'Open lot parking', caption: 'Open lot' },
    ],
    video: {
      src: '', // an .mp4 URL, or leave empty
      poster: '', // a still image shown before playback
      caption: 'See how Igloo works',
    },
  },

  footerLinks: [
    { label: 'Terms of Use', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Help & Support', href: 'mailto:support@iglooparking.com' },
    { label: 'Contact', href: '#contact' },
  ],
}

export const WA_MESSAGES = {
  general: 'Hi, I have a question about Igloo Parking app.',
  moreInfo: "Hi, I'd like to know more about Igloo Parking.",
  host: "Hi, I'd like to list my parking space on Igloo.",
}

/** Builds a wa.me link with a pre-filled message. */
export function waLink(number, message = WA_MESSAGES.general) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
