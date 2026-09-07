import { NextResponse } from 'next/server'
import { updateDb } from '../../_lib/db'
import { requireUser } from '../../_lib/auth'
import { guardMutation, jsonError } from '../../_lib/http'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Removes one enquiry for good. Leads are personal data, so an administrator
 *  has to be able to delete a handled or mistaken one rather than wait for the
 *  retention cap to push it out. */
export async function DELETE(request, context) {
  const rejected = guardMutation(request)
  if (rejected) return rejected
  const { response } = await requireUser(request)
  if (response) return response

  const { id } = await context.params
  if (!UUID.test(String(id || ''))) return jsonError('Unknown enquiry.', 404)

  let removed = false
  try {
    await updateDb(async (next) => {
      const before = next.valetLeads?.length ?? 0
      next.valetLeads = (next.valetLeads ?? []).filter((lead) => lead.id !== id)
      removed = next.valetLeads.length !== before
    })
  } catch (err) {
    console.error('Valet enquiry could not be deleted:', err)
    return jsonError('Could not delete that enquiry. Please try again.', 503)
  }

  if (!removed) return jsonError('Unknown enquiry.', 404)
  return NextResponse.json({ ok: true })
}
