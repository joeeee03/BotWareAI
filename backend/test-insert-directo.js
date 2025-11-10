// Test: Insertar mensaje DIRECTO en la base de datos
// Esto debería activar el trigger y emitir eventos Socket.IO automáticamente

import 'dotenv/config'
import pkg from 'pg'
import { encrypt } from './utils/encryption.js'

const { Pool } = pkg

async function insertDirectMessage() {
  console.log('\n🧪 TEST: Insertando mensaje DIRECTO en base de datos...\n')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    // 1. Obtener un bot y conversación existentes
    const botResult = await pool.query('SELECT id, user_id FROM bots LIMIT 1')
    
    if (botResult.rows.length === 0) {
      console.error('❌ No hay bots en la base de datos')
      console.log('   Crea un bot desde la UI primero\n')
      return
    }
    
    const bot = botResult.rows[0]
    console.log('✅ Bot encontrado:', bot.id, '(User:', bot.user_id, ')')
    
    // 2. Obtener conversación
    const convResult = await pool.query(
      'SELECT id FROM conversations WHERE bot_id = $1 LIMIT 1',
      [bot.id]
    )
    
    let conversationId
    
    if (convResult.rows.length === 0) {
      // Crear conversación
      const newConv = await pool.query(
        `INSERT INTO conversations (bot_id, customer_phone, customer_name, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        [bot.id, '+5491234567890', 'Cliente Test']
      )
      conversationId = newConv.rows[0].id
      console.log('✅ Conversación creada:', conversationId)
    } else {
      conversationId = convResult.rows[0].id
      console.log('✅ Conversación encontrada:', conversationId)
    }
    
    // 3. Insertar mensaje DIRECTAMENTE
    const messageText = `🔥 MENSAJE DIRECTO EN BD - ${new Date().toLocaleTimeString()}`
    const encryptedMessage = encrypt(messageText)
    
    console.log('\n📝 Insertando mensaje en BD...')
    console.log('   Conversation ID:', conversationId)
    console.log('   Mensaje:', messageText)
    console.log('   Sender: bot\n')
    
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [conversationId, bot.id, 'bot', encryptedMessage]
    )
    
    const messageId = result.rows[0].id
    
    console.log('✅ MENSAJE INSERTADO EN BASE DE DATOS')
    console.log('   Message ID:', messageId)
    console.log('   Conversation ID:', conversationId)
    console.log('   Bot User ID:', bot.user_id)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📡 El TRIGGER de PostgreSQL debería haber:')
    console.log('   1. Detectado el INSERT')
    console.log('   2. Enviado notificación al listener del backend')
    console.log('   3. El backend emitió eventos Socket.IO\n')
    console.log('🔍 VERIFICA EN EL BACKEND que veas:')
    console.log('   📬 [REALTIME] Nueva notificación de mensaje: ' + messageId)
    console.log('   📤 [REALTIME] Emitiendo message:new a room: conversation_' + conversationId)
    console.log('   📤 [REALTIME] Emitiendo conversation:updated a room: user_' + bot.user_id)
    console.log('   ✅ [REALTIME] Eventos emitidos exitosamente\n')
    console.log('👀 VERIFICA EN EL NAVEGADOR (DevTools) que veas:')
    console.log('   📨 [MESSAGE-THREAD] New message received')
    console.log('   ✅ [MESSAGE-THREAD] Adding message to current conversation')
    console.log('   🔄 [CHATS-PAGE] Conversation updated event\n')
    console.log('🎯 El mensaje debe aparecer en la UI SIN REFRESCAR\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

insertDirectMessage()
