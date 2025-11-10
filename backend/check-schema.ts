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

async function checkSchema() {
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===');
    
    // Check bots table structure
    const botsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'bots' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n--- BOTS TABLE COLUMNS ---');
    botsSchema.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check users table structure
    const usersSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n--- USERS TABLE COLUMNS ---');
    usersSchema.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if bots table has any data
    const botsData = await pool.query('SELECT * FROM bots LIMIT 5');
    console.log('\n--- BOTS TABLE DATA ---');
    console.log('Row count:', botsData.rowCount);
    if (botsData.rowCount > 0) {
      console.log('Sample data:', botsData.rows[0]);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
