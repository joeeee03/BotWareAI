import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function check(email: string) {
  try {
    const res = await pool.query('SELECT id, email, password_hash, require_password_change, created_at FROM users WHERE email = $1', [email])
    console.log(JSON.stringify(res.rows, null, 2))
  } catch (err) {
    console.error('Error querying DB:', err)
  } finally {
    await pool.end()
  }
}

const email = process.argv[2] || 'owner@negocio.com'
check(email)
