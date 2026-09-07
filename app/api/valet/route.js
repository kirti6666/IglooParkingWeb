import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { readDb, updateDb } from '../_lib/db'
import { requireUser } from '../_lib/auth'
import { guardMutation, jsonError, rateLimit, readJson } from '../_lib/http'

const clean = (value, max = 180) => String(value || '').trim().slice(0, max)

/** Leads are contact details for real people held in a single encrypted
 *  document that is read in full on every request. Keeping them forever grows
 *  that document without bound and holds personal data longer than the enquiry
 *  needs it, so the oldest fall off once this many have accumulated. */
const MAX_LEADS = 500

export async function POST(request) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const limited = rateLimit(
    request,
    'valet',
    10,
    60 * 60 * 1000,
    'Too many valet enquiries. Please try again later.',
  )
  if (limited) return limited

  const { data: body, error } = await readJson(request, 16 * 1024)
  if (error) return error
  // Honeypot: answer exactly as we would a real submission, so a bot learns
  // nothing from the response.
  if (clean(body.website)) return NextResponse.json({ ok: true }, { status: 201 })

  const lead = {
    businessName: clean(body.businessName),
    contactName: clean(body.contactName),
    mobile: clean(body.mobile, 30),
    email: clean(body.email).toLowerCase(),
    addressLine1: clean(body.addressLine1, 240),
    location: clean(body.location),
    city: clean(body.city),
    pin: clean(body.pin, 12),
    state: clean(body.state),
  }

  if (Object.values(lead).some((value) => !value)) {
    return jsonError('Please complete every required field.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) {
    return jsonError('Please enter a valid email address.')
  }
  if (!/^\d{7,15}$/.test(lead.mobile.replace(/\D/g, ''))) {
    return jsonError('Please enter a valid mobile number.')
  }
  if (!/^\d{6}$/.test(lead.pin)) return jsonError('PIN code must contain 6 digits.')

  const record = { id: crypto.randomUUID(), ...lead, submittedAt: new Date().toISOString() }
  try {
    await updateDb(async (next) => {
      next.valetLeads ??= []
      next.valetLeads.push(record)
      if (next.valetLeads.length > MAX_LEADS) {
        next.valetLeads = next.valetLeads.slice(-MAX_LEADS)
      }
    })
  } catch (err) {
    console.error('Valet enquiry could not be stored:', err)
    return jsonError('We could not record that enquiry. Please try again.', 503)
  }
  return NextResponse.json({ ok: true, id: record.id }, { status: 201 })
}

export async function GET(request) {
  const { response } = await requireUser(request)
  if (response) return response
  const db = await readDb()
  return NextResponse.json({
    leads: Array.isArray(db.valetLeads) ? [...db.valetLeads].reverse() : [],
  })
}
