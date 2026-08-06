/**
 * Rebuilds the admin account from server/.env, overwriting whatever is there.
 * Use when you're locked out or have changed ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 *   npm run reset-admin
 */
import 'dotenv/config'
import { seedAdmin } from './routes/auth.js'

await seedAdmin({ force: true })
