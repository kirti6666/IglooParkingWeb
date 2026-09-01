import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { readDb, updateDb } from '../_lib/db'
import { requireUser } from '../_lib/auth'
import { guardMutation, jsonError, rateLimit, storageUnavailable } from '../_lib/http'
import { sendHostRegistrationEmail } from '../_lib/mailer'

const clean = (value, max = 180) => String(value || '').trim().slice(0, max)

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const limited = rateLimit(
    request,
    'host',
    10,
    60 * 60 * 1000,
    'Too many registrations. Please try again later.',
  )
  if (limited) return limited

  const body = await request.json().catch(() => ({}))
  if (clean(body.website)) return NextResponse.json({ ok: true }, { status: 201 })

  const registration = {
    name: clean(body.name),
    building: clean(body.building),
    street: clean(body.street),
    pincode: clean(body.pincode, 12),
    location: clean(body.location, 240),
    mobile: clean(body.mobile, 30),
    email: clean(body.email).toLowerCase(),
  }

  // Building name is optional on the app's registration screen too.
  const required = { ...registration }
  delete required.building
  if (Object.values(required).some((value) => !value)) {
    return jsonError('Please complete every required field.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(registration.email)) {
    return jsonError('Please enter a valid email address.')
  }
  if (!/^\d{7,15}$/.test(registration.mobile.replace(/\D/g, ''))) {
    return jsonError('Please enter a valid mobile number.')
  }
  if (!/^\d{6}$/.test(registration.pincode)) {
    return jsonError('Pincode must contain 6 digits.')
  }

  const record = {
    id: crypto.randomUUID(),
    ...registration,
    otpRequired: body.otpRequired !== false,
    submittedAt: new Date().toISOString(),
  }
  try {
    await sendHostRegistrationEmail(record)
  } catch (error) {
    console.error('[igloo] host registration email failed:', error)
    return jsonError(
      "Sorry — we couldn't send your registration just now. Please try again in a moment.",
      503,
    )
  }
  try {
    await updateDb(async (next) => {
      next.hostRegistrations ??= []
      next.hostRegistrations.push(record)
    })
  } catch (error) {
    return storageUnavailable(error, 'register your space')
  }
  return NextResponse.json({ ok: true, id: record.id }, { status: 201 })
}

export async function GET(request) {
  const { response } = await requireUser(request)
  if (response) return response
  try {
    const db = await readDb()
    return NextResponse.json({
      registrations: Array.isArray(db.hostRegistrations)
        ? [...db.hostRegistrations].reverse()
        : [],
    })
  } catch (error) {
    return storageUnavailable(error, 'load the registrations')
  }
}
