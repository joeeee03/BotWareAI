import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'

// Load root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function run() {
  const email = process.argv[2] || 'owner@negocio.com'
  const hash = process.argv[3]
  if (!hash) {
    console.error('Usage: npx tsx scripts/set-password-hash.ts <email> <hash>')
    process.exit(1)
  }

  try {
    console.log('Setting password hash for', email)
    const res = await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email', [hash, email])
    if (res.rowCount === 0) {
      console.log('No user updated — user may not exist')
    } else {
      console.log('Updated user:', res.rows[0])
    }
  } catch (err) {
    console.error('Error updating password hash:', err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

run()
