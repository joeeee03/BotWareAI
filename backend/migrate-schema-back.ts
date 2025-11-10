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

async function migrateSchemaBack() {
  try {
    console.log('=== MIGRATING SCHEMA BACK TO PLAIN COLUMNS ===');
    
    // First, let's see what data we have
    const botsData = await pool.query('SELECT * FROM bots');
    console.log('Current bots data:', botsData.rows);
    
    // Add the expected columns if they don't exist
    console.log('\n1. Adding plain columns...');
    
    await pool.query(`
      ALTER TABLE bots 
      ADD COLUMN IF NOT EXISTS key_bot VARCHAR(100),
      ADD COLUMN IF NOT EXISTS phone_number_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS access_token TEXT
    `);
    
    console.log('✅ Added plain columns');
    
    // For now, let's set some default values since we can't decrypt the existing data
    console.log('\n2. Setting default values for existing bots...');
    
    for (const bot of botsData.rows) {
      await pool.query(`
        UPDATE bots 
        SET 
          key_bot = $1,
          phone_number_id = $2,
          access_token = $3
        WHERE id = $4
      `, [
        `bot_${bot.id}`, // Simple key based on ID
        '123456789', // Default phone number ID
        'default_access_token', // Default access token
        bot.id
      ]);
    }
    
    console.log('✅ Updated existing bots with default values');
    
    // Make key_bot unique
    console.log('\n3. Adding constraints...');
    
    try {
      await pool.query('ALTER TABLE bots ADD CONSTRAINT bots_key_bot_unique UNIQUE (key_bot)');
      console.log('✅ Added unique constraint to key_bot');
    } catch (error) {
      console.log('⚠️  Unique constraint already exists or failed:', (error as any).message);
    }
    
    // Check final result
    console.log('\n=== FINAL RESULT ===');
    const finalData = await pool.query('SELECT id, user_id, key_bot, phone_number_id, access_token, created_at FROM bots');
    console.log('Updated bots:', finalData.rows);
    
  } catch (error) {
    console.error('Error migrating schema:', error);
  } finally {
    await pool.end();
  }
}

migrateSchemaBack();
