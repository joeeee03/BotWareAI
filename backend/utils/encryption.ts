import crypto from 'crypto';
import bcrypt from 'bcrypt';

// AES-256-GCM encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;
  if (keyString) {
    // Try to parse as hex first
    if (/^[0-9a-fA-F]+$/.test(keyString)) {
      return Buffer.from(keyString, 'hex');
    }
    
    // Otherwise, use as UTF-8 string and hash to get 32 bytes
    console.log('[ENCRYPTION] Key is not hex, using as UTF-8 string');
    const hash = crypto.createHash('sha256').update(keyString).digest();
    return hash;
  }
  
  // Generate a new key if none exists (for development)
  const newKey = crypto.randomBytes(KEY_LENGTH);
  console.warn('⚠️  No ENCRYPTION_KEY found in environment. Generated temporary key:', newKey.toString('hex'));
  console.warn('⚠️  Add this to your .env file: ENCRYPTION_KEY=' + newKey.toString('hex'));
  return newKey;
}

const encryptionKey = getEncryptionKey();
console.log('[ENCRYPTION] Using encryption key (first 8 chars):', encryptionKey.toString('hex').slice(0, 16));

// =============================================================================
// AES ENCRYPTION (TWO-WAY) - Use for data that needs to be decrypted later
// =============================================================================

/**
 * Encrypt data using AES-256-GCM (reversible encryption)
 * Use this for chat messages, bot configurations, user data, etc.
 * @param text - Plain text to encrypt
 * @returns Encrypted data in format: iv:tag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    cipher.setAAD(Buffer.from('chats-platform', 'utf8')); // Additional authenticated data
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return format: iv:tag:encryptedData
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM (reversible decryption)
 * Use this to decrypt chat messages, bot configurations, user data, etc.
 * @param encryptedData - Encrypted data in format: iv:tag:encryptedData OR old base64 format
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  try {
    // Check if it's the new format (iv:tag:encryptedData)
    if (encryptedData.includes(':')) {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const [ivHex, tagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from('chats-platform', 'utf8'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } else {
      // OLD FORMAT: Simple base64 AES encryption (fallback for legacy messages)
      console.log('[DECRYPT] Detecting old format encryption (base64)');
      
      // Try to decrypt old format (simple AES-256-CBC)
      try {
        const encrypted = Buffer.from(encryptedData, 'base64');
        const iv = Buffer.alloc(16, 0); // Old format used zero IV
        const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey.slice(0, 32), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
      } catch (oldFormatError) {
        console.error('[DECRYPT] Failed to decrypt old format, returning as-is');
        // If both formats fail, return the original (might be plain text)
        return encryptedData;
      }
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// =============================================================================
// PASSWORD HASHING (ONE-WAY) - Use bcrypt for passwords, tokens, keys
// =============================================================================

/**
 * Hash password using bcrypt (one-way, secure, non-reversible)
 * Use this for passwords, authentication tokens, API keys, etc.
 * @param password - Plain text password
 * @returns Bcrypt hash (non-reversible)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // 10 salt rounds as requested
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against bcrypt hash
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash from database
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Hash sensitive tokens/keys using bcrypt (one-way)
 * Use for API keys, access tokens, etc. that should never be decrypted
 * @param token - Plain text token/key
 * @returns Bcrypt hash (non-reversible)
 */
export async function hashToken(token: string): Promise<string> {
  const saltRounds = 10; // Slightly lower for tokens (still very secure)
  try {
    return await bcrypt.hash(token, saltRounds);
  } catch (error) {
    console.error('Token hashing error:', error);
    throw new Error('Failed to hash token');
  }
}

/**
 * Verify token against bcrypt hash
 * @param token - Plain text token to verify
 * @param hash - Bcrypt hash from database
 * @returns True if token matches
 */
export async function verifyToken(token: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(token, hash);
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random encryption key
 * @returns Hex string of random key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

// =============================================================================
// UTILITY FUNCTIONS - Convenience wrappers for specific use cases
// =============================================================================

/**
 * Encrypt sensitive bot data (AES - reversible)
 * Use for bot tokens, webhook URLs, phone numbers, etc. that need to be decrypted
 * @param data - Sensitive data to encrypt
 * @returns Encrypted data
 */
export function encryptSensitiveData(data: string): string {
  return encrypt(data);
}

/**
 * Decrypt sensitive bot data (AES - reversible)
 * Use to decrypt bot tokens, webhook URLs, phone numbers, etc.
 * @param encryptedData - Encrypted data to decrypt
 * @returns Decrypted data
 */
export function decryptSensitiveData(encryptedData: string): string {
  return decrypt(encryptedData);
}

/**
 * Encrypt chat message content (AES - reversible)
 * @param message - Chat message to encrypt
 * @returns Encrypted message
 */
export function encryptMessage(message: string): string {
  return encrypt(message);
}

/**
 * Decrypt chat message content (AES - reversible)
 * @param encryptedMessage - Encrypted message to decrypt
 * @returns Decrypted message
 */
export function decryptMessage(encryptedMessage: string): string {
  return decrypt(encryptedMessage);
}
