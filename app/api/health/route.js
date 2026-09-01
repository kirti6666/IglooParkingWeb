import { NextResponse } from 'next/server'

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
    },
  })
}
