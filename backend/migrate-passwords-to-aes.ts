import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { hashPassword, verifyPassword } from './utils/encryption.js';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migratePasswordsToAES() {
  try {
    console.log('=== MIGRATING PASSWORDS FROM BCRYPT TO AES ===');
    
    // Get all users with their current password hashes
    const usersResult = await pool.query('SELECT id, email, password_hash FROM users');
    console.log(`Found ${usersResult.rowCount} users to check`);
    
    for (const user of usersResult.rows) {
      console.log(`\nProcessing user: ${user.email} (ID: ${user.id})`);
      
      // Check if password is already AES encrypted
      try {
        // Try to verify with a dummy password using AES
        verifyPassword('dummy', user.password_hash);
        console.log('✅ Password is already AES encrypted');
        continue;
      } catch (error) {
        // If AES fails, it's likely bcrypt - we need to migrate
        console.log('🔄 Password appears to be bcrypt, attempting migration...');
        
        // Since we can't decrypt bcrypt, we'll set a temporary password
        // and require password change on next login
        const tempPassword = 'TempPass123!';
        const newAESHash = hashPassword(tempPassword);
        
        await pool.query(
          'UPDATE users SET password_hash = $1, require_password_change = true WHERE id = $2',
          [newAESHash, user.id]
        );
        
        console.log(`✅ Migrated ${user.email} to AES with temporary password`);
        console.log(`   Temporary password: ${tempPassword}`);
        console.log(`   User will be required to change password on next login`);
      }
    }
    
    console.log('\n=== MIGRATION COMPLETED ===');
    console.log('All users have been migrated to AES encryption.');
    console.log('Users with temporary passwords will be required to change them on next login.');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePasswordsToAES();
}
