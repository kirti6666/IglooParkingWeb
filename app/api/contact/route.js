import { NextResponse } from 'next/server'
import { guardMutation, jsonError, rateLimit } from '../_lib/http'
import { sendContactEmail } from '../_lib/mailer'

const clean = (value, max = 180) => String(value || '').trim().slice(0, max)

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const limited = rateLimit(
    request,
    'contact',
    8,
    60 * 60 * 1000,
    'Too many messages. Please try again later.',
  )
  if (limited) return limited

  const body = await request.json().catch(() => ({}))
  if (clean(body.company)) return NextResponse.json({ ok: true }, { status: 201 })

  const enquiry = {
    name: clean(body.name),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone, 30),
    message: clean(body.message, 4000),
  }

  if (!enquiry.name || !enquiry.email || !enquiry.message) {
    return jsonError('Please fill in all required fields.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(enquiry.email)) {
    return jsonError('Please enter a valid email address.')
  }
  if (enquiry.phone && !/^\+?[0-9 ()-]{7,24}$/.test(enquiry.phone)) {
    return jsonError('Please enter a valid phone number.')
  }

  try {
    await sendContactEmail(enquiry)
  } catch (error) {
    console.error('[igloo] contact email failed:', error)
    return jsonError(
      "Sorry — we couldn't send your message just now. Please try again in a moment.",
      503,
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
