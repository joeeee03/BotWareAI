import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function updateUserHash() {
  const email = 'admin@test.com';
  const password = 'BotWhatsapp!';
  const saltRounds = 10;
  
  try {
    // Generate correct hash
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Generated hash for password:', password);
    console.log('Hash:', hash);
    
    // Update user in database
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hash, email]
    );
    
    if (result.rowCount === 0) {
      console.log('No user found with email:', email);
    } else {
      console.log('Updated user:', result.rows[0]);
      
      // Verify the hash works
      const isValid = await bcrypt.compare(password, hash);
      console.log('Hash verification:', isValid);
    }
    
  } catch (error) {
    console.error('Error updating user hash:', error);
  } finally {
    await pool.end();
  }
}

updateUserHash();
