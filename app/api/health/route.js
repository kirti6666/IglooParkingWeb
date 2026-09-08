import { NextResponse } from 'next/server'
import { authenticate } from '../_lib/auth'
import { enquiryMailerReady } from '../_lib/mailer'

/**
 * Liveness for anyone; configuration detail only for a signed-in admin.
 *
 * The detail block tells you whether storage is connected, whether the signing
 * secret is long enough, whether the seeded admin password passes policy and
 * where enquiry mail is going — a useful map for someone deciding where to
 * push. It was previously public.
 */
export async function GET(request) {
  const user = await authenticate(request).catch(() => null)
  if (!user) return NextResponse.json({ ok: true })

  const password = process.env.ADMIN_PASSWORD || ''
  const jwtSecret = process.env.JWT_SECRET || ''
  return NextResponse.json({
    ok: true,
    configuration: {
      blobConnected: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      jwtSecretValid: jwtSecret.length >= 32,
      adminEmailConfigured: Boolean(process.env.ADMIN_EMAIL),
      adminPasswordValid:
        password.length >= 10 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password),
      smtpProvider: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      enquiryRecipient: process.env.WEBSITE_ENQUIRY_TO_EMAIL || 'support@iglooparking.com',
      enquiryEmailReady: enquiryMailerReady(),
    },
  })
}
