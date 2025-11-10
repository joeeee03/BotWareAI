import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function update(email: string, hash: string) {
  try {
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email])
    console.log(`Updated password_hash for ${email}`)
  } catch (err) {
    console.error('Error updating password_hash:', err)
  } finally {
    await pool.end()
  }
}

const email = process.argv[2] || 'owner@negocio.com'
const hash = process.argv[3] || '$2b$10$.GHZkJNYc6WiNE1ErZSC1OCY07C/luN72CbqqK.4pBGCBha3yVGwC'
update(email, hash)
