// Test para enviar un mensaje REAL y ver si llega al frontend
import 'dotenv/config'
import pkg from 'pg'
import { encrypt, decrypt } from './utils/encryption.js'

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function sendTestMessage() {
  console.log('🧪 TEST: Enviando mensaje de prueba...\n')
  
  try {
    // 1. Obtener un bot existente
    const botResult = await pool.query('SELECT id, user_id FROM bots LIMIT 1')
    
    if (botResult.rows.length === 0) {
      console.error('❌ No hay bots en la base de datos')
      console.log('   Crea un bot primero desde la UI')
      return
    }
    
    const bot = botResult.rows[0]
    console.log('✅ Bot encontrado:', bot)
    
    // 2. Obtener o crear una conversación
    let conversationResult = await pool.query(
      'SELECT id FROM conversations WHERE bot_id = $1 LIMIT 1',
      [bot.id]
    )
    
    let conversationId
    
    if (conversationResult.rows.length === 0) {
      // Crear conversación de prueba
      const newConv = await pool.query(
        `INSERT INTO conversations (bot_id, customer_phone, customer_name, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        [bot.id, '+5491234567890', 'Cliente Test']
      )
      conversationId = newConv.rows[0].id
      console.log('✅ Conversación creada:', conversationId)
    } else {
      conversationId = conversationResult.rows[0].id
      console.log('✅ Conversación encontrada:', conversationId)
    }
    
    // 3. Insertar mensaje
    const testMessage = `Mensaje de prueba ${new Date().toLocaleTimeString()}`
    const encryptedMessage = encrypt(testMessage)
    
    const messageResult = await pool.query(
      `INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, conversation_id, bot_id, sender, message, created_at`,
      [conversationId, bot.id, 'bot', encryptedMessage]
    )
    
    const newMessage = messageResult.rows[0]
    console.log('✅ Mensaje insertado en DB:', newMessage.id)
    
    // 4. Simular lo que hace el webhook: emitir evento Socket.IO
    console.log('\n📤 Lo que el webhook DEBERÍA emitir:')
    console.log('   Evento: message:new')
    console.log('   Room: conversation_' + conversationId)
    console.log('   Data:', {
      id: newMessage.id,
      conversation_id: conversationId,
      message: decrypt(newMessage.message),
      sender: 'bot',
      created_at: newMessage.created_at
    })
    
    console.log('\n📤 Y también debería emitir:')
    console.log('   Evento: conversation:updated')
    console.log('   Room: user_' + bot.user_id)
    console.log('   Data:', {
      conversationId: conversationId,
      lastMessage: decrypt(newMessage.message),
      lastMessageTime: newMessage.created_at
    })
    
    console.log('\n✅ Mensaje insertado exitosamente en la base de datos')
    console.log('⚠️  PERO: Este script NO emite eventos Socket.IO')
    console.log('🔍 Para probar Socket.IO, usa: node test-webhook.js')
    console.log('\n💡 O envía un mensaje desde la UI y observa los logs')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

sendTestMessage()
