import { NextResponse } from 'next/server'
import { requireUser } from '../../_lib/auth'
import { verifyMailer } from '../../_lib/mailer'

/**
 * Admin-only SMTP check.
 *
 * The enquiry routes catch a send failure and report something reassuring to
 * the visitor, which leaves the real cause only in the platform's function
 * log. This connects and authenticates on demand and reports back what
 * happened, so a broken mailbox can be identified from a browser.
 *
 * Sign in at /#admin first, then open /api/health/smtp in the same browser.
 */
export async function GET(request) {
  const { response } = await requireUser(request)
  if (response) return response

  const result = await verifyMailer()
  return NextResponse.json(
    {
      ...result,
      // Never the password — everything else is what a misconfiguration hides in.
      config: {
        host: process.env.SMTP_HOST || '(unset — defaults to smtp.gmail.com)',
        port: process.env.SMTP_PORT || '(unset — defaults to 465)',
        secure: process.env.SMTP_SECURE ?? '(unset — inferred from the port)',
        user: process.env.SMTP_USER || '(unset)',
        passwordSet: Boolean(process.env.SMTP_PASS),
        passwordLength: process.env.SMTP_PASS?.length ?? 0,
        from: process.env.MAIL_FROM || '(unset)',
        deliversTo: process.env.WEBSITE_ENQUIRY_TO_EMAIL || '(unset — defaults to support@iglooparking.com)',
      },
    },
    { status: result.ok ? 200 : 503 },
  )
}
