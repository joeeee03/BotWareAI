import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'

// Load root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function run() {
  const email = process.argv[2] || 'owner@negocio.com'
  const password = process.argv[3] || 'hola1234'

  try {
    console.log('Updating password for', email)
    const hash = await bcrypt.hash(password, 10)
    const res = await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email', [hash, email])
    if (res.rowCount === 0) {
      console.log('No user updated — user may not exist')
    } else {
      console.log('Updated user:', res.rows[0])
    }
  } catch (err) {
    console.error('Error updating password:', err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

run()
