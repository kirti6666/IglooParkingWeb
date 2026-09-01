import nodemailer from 'nodemailer'

let transport = null

function getTransport() {
  if (!process.env.SMTP_HOST) return null
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
  return transport
}

export async function sendResetEmail(to, resetUrl) {
  const mailer = getTransport()
  if (!mailer) {
    console.log(`Password reset for ${to}: ${resetUrl}`)
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

export function contactMailerReady() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER || process.env.ADMIN_EMAIL),
  )
}

export async function sendContactEmail({ name, email, phone, message }) {
  const mailer = getTransport()
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER || process.env.ADMIN_EMAIL
  if (!mailer || !to) {
    throw new Error('Contact email delivery is not configured.')
  }

  await mailer.sendMail({
    from: process.env.MAIL_FROM || `Igloo Parking <${process.env.SMTP_USER}>`,
    to,
    replyTo: email,
    subject: `Igloo Parking website enquiry from ${name.replace(/[\r\n]+/g, ' ')}`,
    text: [
      'A new enquiry was submitted through the Igloo Parking website.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      '',
      'Message:',
      message,
    ].join('\n'),
  })
}
