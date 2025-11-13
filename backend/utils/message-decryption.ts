// Message decryption utility based on deterministic AES encryption
import 'dotenv/config'
import crypto from 'crypto'

/* ============================================================
   🔒 Configuración de cifrado (determinista)
   ============================================================ */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''
// Generate a temporary key if not provided (for development/Railway initial setup)
const FINAL_KEY = ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
if (!ENCRYPTION_KEY) {
  console.warn('⚠️  No ENCRYPTION_KEY found in environment. Generated temporary key:', FINAL_KEY)
  console.warn('⚠️  Add this to your .env file: ENCRYPTION_KEY=' + FINAL_KEY)
}

const KEY = crypto.createHash('sha256').update(FINAL_KEY).digest() // 32 bytes exactos
const IV = KEY.slice(0, 16) // IV fijo → cifrado determinista compatible
const ALGORITHM = 'aes-256-cbc'

/* ============================================================
   🔒 Encriptar / Desencriptar texto (determinista)
   ============================================================ */
export function encrypt(text: string | null): string | null {
  if (!text) return null
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

export function decrypt(encryptedText: string | null): string | null {
  if (!encryptedText) return null
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV)
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('❌ Error decrypting message:', error)
    return '[Encrypted Message - Unable to decrypt]'
  }
}

/* ============================================================
   🔍 Buscar bot por KEY_BOT desencriptada
   ============================================================ */
export function encryptBotKey(plainKeyBot: string): string | null {
  return encrypt(plainKeyBot)
}

/* ============================================================
   💬 Desencriptar mensajes en lote
   ============================================================ */
export function decryptMessages(messages: any[]): any[] {
  return messages.map(message => ({
    ...message,
    message: decrypt(message.message) || message.message,
    last_message: message.last_message ? decrypt(message.last_message) || message.last_message : message.last_message
  }))
}

export function decryptConversations(conversations: any[]): any[] {
  return conversations.map(conversation => ({
    ...conversation,
    last_message: conversation.last_message ? decrypt(conversation.last_message) || conversation.last_message : conversation.last_message
  }))
}
