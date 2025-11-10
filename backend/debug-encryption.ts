import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== DEBUGGING ENCRYPTION CONFIGURATION ===');
console.log('Current directory:', __dirname);
console.log('Env file path:', path.join(__dirname, '.env'));
console.log('ENCRYPTION_KEY from env:', process.env.ENCRYPTION_KEY);
console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY?.length);

// Test if we can import and use the encryption
import { encrypt, decrypt, hashPassword, verifyPassword } from './utils/encryption.js';

const testPassword = 'BotWhatsapp!';
console.log('\n=== TESTING ENCRYPTION ===');
console.log('Test password:', testPassword);

try {
  const hash = hashPassword(testPassword);
  console.log('Generated hash:', hash);
  
  const isValid = verifyPassword(testPassword, hash);
  console.log('Verification result:', isValid);
  
  // Test with the hash from database
  const dbHash = 'b3467278869af2cbd78bef0f32140501:e883e387e530a098a2bc163a5261b0c6:03b2fa129cb1680c551e53c9';
  console.log('\n=== TESTING DB HASH ===');
  console.log('DB hash:', dbHash);
  
  try {
    const dbResult = verifyPassword(testPassword, dbHash);
    console.log('DB verification result:', dbResult);
  } catch (error) {
    console.log('DB verification error:', error.message);
  }
  
} catch (error) {
  console.error('Encryption test error:', error);
}
