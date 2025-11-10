import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { verifyPassword } from './utils/encryption.js';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkCurrentPasswords() {
  try {
    console.log('=== CHECKING CURRENT PASSWORDS ===');
    
    const users = await pool.query('SELECT id, email, password_hash FROM users');
    
    for (const user of users.rows) {
      console.log(`\n--- User: ${user.email} ---`);
      console.log('Hash:', user.password_hash);
      
      const testPassword = 'BotWhatsapp!';
      
      // Test AES
      try {
        const aesResult = verifyPassword(testPassword, user.password_hash);
        console.log('AES verification:', aesResult ? '✅ SUCCESS' : '❌ FAILED');
      } catch (error) {
        console.log('AES verification: ❌ ERROR -', error.message);
      }
      
      // Test bcrypt
      try {
        const bcryptResult = await bcrypt.compare(testPassword, user.password_hash);
        console.log('bcrypt verification:', bcryptResult ? '✅ SUCCESS' : '❌ FAILED');
      } catch (error) {
        console.log('bcrypt verification: ❌ ERROR -', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentPasswords();
