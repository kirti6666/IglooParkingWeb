import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())
const { seedAdmin } = await import('../app/api/_lib/auth.js')
const user = await seedAdmin({ force: true })

if (!user) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.')
}

console.log(`Admin account reset: ${user.email}`)
