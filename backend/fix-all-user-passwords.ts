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

async function fixAllUserPasswords() {
  const password = 'BotWhatsapp!';
  const saltRounds = 10;
  
  try {
    // Generate correct hash
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Generated hash for password:', password);
    console.log('Hash:', hash);
    
    // Get all users
    const usersResult = await pool.query('SELECT id, email, password_hash FROM users');
    console.log('Found', usersResult.rowCount, 'users to update');
    
    for (const user of usersResult.rows) {
      console.log(`\nUpdating user: ${user.email} (ID: ${user.id})`);
      console.log('Old hash:', user.password_hash);
      
      // Test if current hash works with the password
      try {
        const currentHashWorks = await bcrypt.compare(password, user.password_hash);
        console.log('Current hash works with BotWhatsapp!:', currentHashWorks);
        
        if (!currentHashWorks) {
          // Update with correct hash
          const updateResult = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING email',
            [hash, user.id]
          );
          console.log('✅ Updated password hash for:', updateResult.rows[0].email);
        } else {
          console.log('✅ Password hash already correct for:', user.email);
        }
      } catch (error) {
        console.log('❌ Error testing current hash, updating anyway:', error.message);
        // Update with correct hash
        const updateResult = await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING email',
          [hash, user.id]
        );
        console.log('✅ Updated password hash for:', updateResult.rows[0].email);
      }
    }
    
    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const finalResult = await pool.query('SELECT id, email, password_hash FROM users');
    for (const user of finalResult.rows) {
      const works = await bcrypt.compare(password, user.password_hash);
      console.log(`${user.email}: ${works ? '✅ WORKS' : '❌ FAILED'}`);
    }
    
  } catch (error) {
    console.error('Error fixing user passwords:', error);
  } finally {
    await pool.end();
  }
}

fixAllUserPasswords();
