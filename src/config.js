/**
 * ---------------------------------------------------------------
 * IGLOO PARKING — default site configuration.
 *
 * This object is the shipped default. The admin panel (open the site
 * with #admin in the URL) edits a copy of it live, publishes it through
 * the Next.js API, and can export it as JSON.
 *
 * It ships inside the browser bundle, so it holds no credentials of any
 * kind. Admin sign-in is verified server-side against a bcrypt hash in
 * the encrypted database — see app/api/auth.
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

  contact: {
    // Digits only, with country code — this is the wa.me format.
    whatsappNumber: '919972630567',
    whatsappDisplay: '+91 99726 30567',
    email: 'support@iglooparking.com',
    instagram: 'https://www.instagram.com/iglooparking?igsh=YW96bXE0YmhhYTg3',
  },

  links: {
    appStore: 'https://apps.apple.com/in/app/igloo-parking/id6759717457',
    playStore: 'https://play.google.com/store/apps/details?id=com.igloo.iglooparking',
  },

  /* Photos and video of real parking spaces.
     Empty strings keep that media slot hidden on the public site. */
  media: {
    galleryTitle: 'Real spaces, real spots.',
    gallerySubtitle:
      'Covered basements, quiet driveways, and lots with charging — every listing is a real space with a real host.',
    images: [
      {
        src: '/gallery/covered-basement.jpg',
        alt: 'Bright covered basement parking with marked bays',
        caption: 'Covered basement',
      },
      {
        src: '/gallery/private-parking-bays.jpg',
        alt: 'Landscaped private parking bays viewed from above',
        caption: 'Private parking bays',
      },
      { src: '', alt: 'Parking bay with EV charging', caption: 'EV charging bay' },
      {
        src: '/gallery/open-parking-lot.jpg',
        alt: 'Aerial view of a marked outdoor parking lot',
        caption: 'Open parking lot',
      },
    ],
    videos: [
      {
        src: '', // an .mp4 URL, or leave empty
        poster: '', // a still image shown before playback
        caption: 'See how Igloo works',
      },
    ],
  },

  footerLinks: [
    { label: 'Terms of Use', href: './terms.html' },
    { label: 'Privacy Policy', href: './privacy.html' },
    { label: 'Help & Support', href: './help.html' },
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
