import { NextResponse } from 'next/server'
import { enquiryMailerReady } from '../_lib/mailer'

export function GET() {
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
      smtpConfigured: Boolean(
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
      ),
      enquiryRecipient: process.env.WEBSITE_ENQUIRY_TO_EMAIL || 'support@iglooparking.com',
      enquiryEmailReady: enquiryMailerReady(),
    },
  })
}
