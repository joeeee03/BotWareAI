import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { hashPassword } from './utils/encryption.js';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY);

// Railway connection - remove sslmode parameter and disable SSL for now
const dbUrl = process.env.DATABASE_URL?.replace('?sslmode=require', '') || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: false,
});

async function fixUserPasswords() {
  try {
    console.log('=== FIXING USER PASSWORDS WITH AES ===');
    
    const password = 'BotWhatsapp!';
    const aesHash = hashPassword(password);
    
    console.log('New AES hash:', aesHash);
    
    // Update all users to use AES encryption
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, require_password_change = false',
      [aesHash]
    );
    
    console.log(`✅ Updated ${result.rowCount} users with AES encrypted password`);
    console.log(`Password for all users: ${password}`);
    
    // Verify the update
    const users = await pool.query('SELECT id, email, password_hash FROM users');
    console.log('\n--- Updated Users ---');
    users.rows.forEach(user => {
      console.log(`${user.email}: ${user.password_hash.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixUserPasswords();
