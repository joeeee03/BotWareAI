import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function setPassword(email: string, password: string) {
  try {
    const hash = await bcrypt.hash(password, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email])
    console.log(`Updated password for ${email}`)
  } catch (err) {
    console.error('Error updating password:', err)
  } finally {
    await pool.end()
  }
}

const email = process.argv[2] || 'owner@negocio.com'
const password = process.argv[3] || 'hola1234'
setPassword(email, password)
