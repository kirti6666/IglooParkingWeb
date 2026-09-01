import nodemailer from 'nodemailer'

let transport = null
const DEFAULT_ENQUIRY_RECIPIENT = 'support@iglooparking.com'

const safeHeader = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim()

function enquiryRecipient() {
  return (
    process.env.WEBSITE_ENQUIRY_TO_EMAIL ||
    process.env.CONTACT_TO_EMAIL ||
    DEFAULT_ENQUIRY_RECIPIENT
  )
}

function getTransport() {
  if (!process.env.SMTP_HOST) return null
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE
    ? String(process.env.SMTP_SECURE) === 'true'
    : port === 465
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: port === 587,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    tls: { minVersion: 'TLSv1.2' },
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

export function enquiryMailerReady() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      enquiryRecipient(),
  )
}

async function sendEnquiryEmail({ replyTo, subject, lines }) {
  const mailer = getTransport()
  const to = enquiryRecipient()
  if (!mailer || !to) {
    throw new Error('Website enquiry email delivery is not configured.')
  }

  await mailer.sendMail({
    from:
      process.env.MAIL_FROM ||
      `Igloo Parking <${process.env.SMTP_USER || DEFAULT_ENQUIRY_RECIPIENT}>`,
    to,
    replyTo,
    subject: safeHeader(subject),
    text: lines.join('\n'),
  })
}

export async function sendContactEmail({ name, email, phone, message }) {
  await sendEnquiryEmail({
    replyTo: email,
    subject: `Igloo Parking website enquiry from ${safeHeader(name)}`,
    lines: [
      'A new enquiry was submitted through the Igloo Parking website.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      '',
      'Message:',
      message,
    ],
  })
}

export async function sendHostRegistrationEmail(registration) {
  await sendEnquiryEmail({
    replyTo: registration.email,
    subject: `New Igloo Parking host registration from ${safeHeader(registration.name)}`,
    lines: [
      'A new host registration was submitted through the Igloo Parking website.',
      '',
      `Name: ${registration.name}`,
      `Email: ${registration.email}`,
      `Mobile: ${registration.mobile}`,
      `Building: ${registration.building || 'Not provided'}`,
      `Street: ${registration.street}`,
      `Pincode: ${registration.pincode}`,
      `Parking location: ${registration.location}`,
      `OTP authentication required: ${registration.otpRequired ? 'Yes' : 'No'}`,
      `Submitted at: ${registration.submittedAt}`,
    ],
  })
}

export async function sendValetEnquiryEmail(lead) {
  await sendEnquiryEmail({
    replyTo: lead.email,
    subject: `New Igloo Parking valet enquiry from ${safeHeader(lead.businessName)}`,
    lines: [
      'A new valet parking enquiry was submitted through the Igloo Parking website.',
      '',
      `Business / establishment: ${lead.businessName}`,
      `Contact person: ${lead.contactName}`,
      `Email: ${lead.email}`,
      `Mobile: ${lead.mobile}`,
      `Address line 1: ${lead.addressLine1}`,
      `Location / area: ${lead.location}`,
      `City: ${lead.city}`,
      `PIN code: ${lead.pin}`,
      `State: ${lead.state}`,
      `Submitted at: ${lead.submittedAt}`,
    ],
  })
}
