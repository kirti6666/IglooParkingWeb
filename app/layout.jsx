import '../src/styles.css'

export const metadata = {
  title: 'Igloo Parking — Park. Share. Earn.',
  description:
    'Find parking in seconds — or list your empty spot and start earning from it today. Igloo Parking connects riders with parking hosts. Now live on iPhone.',
  openGraph: {
    title: 'Igloo Parking — Park. Share. Earn.',
    description:
      'Find parking in seconds — or list your empty spot and start earning from it today.',
    type: 'website',
  },
  icons: { icon: '/favicon.svg' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1782A6',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Manrope:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
