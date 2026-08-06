/**
 * Password-reset email. With no SMTP configured (development), the link is
 * printed to the server console instead of being sent — so the flow can be
 * tested without a mail provider.
 */
import nodemailer from 'nodemailer'

let transport = null

function getTransport() {
  if (!process.env.SMTP_HOST) return null
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  }
  return transport
}

export async function sendResetEmail(to, resetUrl) {
  const mailer = getTransport()

  if (!mailer) {
    console.log('\n─── password reset (no SMTP configured) ───')
    console.log(`  to:   ${to}`)
    console.log(`  link: ${resetUrl}`)
    console.log('───────────────────────────────────────────\n')
    return
  }

  await mailer.sendMail({
    from: process.env.MAIL_FROM || 'Igloo Parking <no-reply@iglooparking.com>',
    to,
    subject: 'Reset your Igloo Parking admin password',
    text: [
      'Someone asked to reset the password for your Igloo Parking admin account.',
      '',
      `Reset it here: ${resetUrl}`,
      '',
      'This link works once and expires in 30 minutes.',
      "If this wasn't you, ignore this email — nothing has changed.",
    ].join('\n'),
  })
}
