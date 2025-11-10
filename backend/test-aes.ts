import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { encrypt, decrypt, hashPassword, verifyPassword, generateEncryptionKey } from './utils/encryption.js';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testAESEncryption() {
  console.log('=== TESTING AES ENCRYPTION ===');
  
  try {
    // Test basic encryption/decryption
    const testData = 'Hello, this is sensitive data!';
    console.log('Original data:', testData);
    
    const encrypted = encrypt(testData);
    console.log('Encrypted:', encrypted);
    
    const decrypted = decrypt(encrypted);
    console.log('Decrypted:', decrypted);
    
    console.log('✅ Basic encryption test:', testData === decrypted ? 'PASSED' : 'FAILED');
    
    // Test password hashing
    const password = 'BotWhatsapp!';
    console.log('\n--- Password Testing ---');
    console.log('Original password:', password);
    
    const hashedPassword = hashPassword(password);
    console.log('Hashed password:', hashedPassword);
    
    const isValid = verifyPassword(password, hashedPassword);
    console.log('Password verification:', isValid ? 'PASSED' : 'FAILED');
    
    const isInvalid = verifyPassword('wrongpassword', hashedPassword);
    console.log('Wrong password test:', !isInvalid ? 'PASSED' : 'FAILED');
    
    // Test key generation
    console.log('\n--- Key Generation ---');
    const newKey = generateEncryptionKey();
    console.log('Generated key:', newKey);
    console.log('Key length:', newKey.length, 'characters (should be 64 for 256-bit key)');
    
    console.log('\n✅ All AES tests completed successfully!');
    
  } catch (error) {
    console.error('❌ AES test failed:', error);
  }
}

testAESEncryption();
