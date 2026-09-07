/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // DENY to match the CSP's frame-ancestors below, for older browsers.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nothing here needs a camera, a microphone or the visitor's location.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inlines its bootstrap and flight payload without a nonce.
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              // Admins may point gallery slots at media hosted anywhere over TLS.
              "img-src 'self' data: https:",
              "media-src 'self' https:",
              // The contact form can post to an admin-configured endpoint.
              "connect-src 'self' https:",
              "object-src 'none'",
              // Modern equivalent of X-Frame-Options, and it covers nested frames.
              "frame-ancestors 'none'",
              // A stored <base> or an injected form can't retarget the page.
              "base-uri 'self'",
              "form-action 'self'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
