import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
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

async function checkAllUsers() {
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, require_password_change, created_at FROM users ORDER BY id'
    );
    
    console.log('Found', result.rowCount, 'users:');
    result.rows.forEach(user => {
      console.log('---');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Password hash:', user.password_hash);
      console.log('Require password change:', user.require_password_change);
      console.log('Created at:', user.created_at);
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await pool.end();
  }
}

checkAllUsers();
