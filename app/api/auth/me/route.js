import { NextResponse } from 'next/server'
import { requireUser } from '../../_lib/auth'

export async function GET(request) {
  const { user, response } = await requireUser(request)
  return response || NextResponse.json({ email: user.email })
}
