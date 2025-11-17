// PostgreSQL LISTEN/NOTIFY para detectar mensajes insertados desde cualquier fuente
// Detecta cuando se insertan mensajes en la tabla messages y los emite vía Socket.IO

import pg from 'pg'
import { io } from '../server.js'
import { decrypt } from '../utils/message-decryption.js'

const { Client } = pg

let listenerClient: pg.Client | null = null

/**
 * Iniciar listener de PostgreSQL para detectar nuevos mensajes
 */
export async function startMessageListener() {
  try {
    console.log('[MESSAGE-LISTENER] 🎧 Iniciando PostgreSQL LISTEN para nuevos mensajes...')

    // Crear cliente dedicado para LISTEN (no usar pool)
    // Usar DATABASE_URL si está disponible (Railway), sino variables individuales
    const connectionConfig = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number.parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'whatsapp_db',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
        }

    console.log('[MESSAGE-LISTENER] Conectando a PostgreSQL:', process.env.DATABASE_URL ? 'usando DATABASE_URL' : 'usando variables individuales')
    
    listenerClient = new Client(connectionConfig)

    await listenerClient.connect()
    console.log('[MESSAGE-LISTENER] ✅ Cliente PostgreSQL conectado para LISTEN')

    // Escuchar notificaciones de nuevos mensajes Y nuevas conversaciones
    listenerClient.on('notification', async (msg) => {
      // NUEVAS CONVERSACIONES
      if (msg.channel === 'new_conversation') {
        try {
          const conversationData = JSON.parse(msg.payload || '{}')
          console.log('[MESSAGE-LISTENER] 🆕 Nueva conversación detectada:', {
            id: conversationData.conversation_id,
            customer_phone: conversationData.customer_phone,
            customer_name: conversationData.customer_name
          })

          // Obtener user_id del bot para emitir actualización
          try {
            const pool = (await import('../config/database.js')).default
            const botResult = await pool.query(
              'SELECT user_id FROM bots WHERE id = $1',
              [conversationData.bot_id]
            )
            
            if (botResult.rows.length > 0) {
              const userId = botResult.rows[0].user_id
              const userRoom = `user_${userId}`
              console.log('[MESSAGE-LISTENER] 📤 Emitiendo conversation:new a room:', userRoom)
              
              // Emitir nueva conversación al usuario
              io.to(userRoom).emit('conversation:new', {
                id: conversationData.conversation_id,
                bot_id: conversationData.bot_id,
                customer_phone: conversationData.customer_phone,
                customer_name: conversationData.customer_name,
                created_at: conversationData.created_at
              })
            }
          } catch (err) {
            console.error('[MESSAGE-LISTENER] ❌ Error al obtener user_id:', err)
          }

          console.log('[MESSAGE-LISTENER] ✅ Nueva conversación emitida vía Socket.IO')
        } catch (error) {
          console.error('[MESSAGE-LISTENER] ❌ Error procesando nueva conversación:', error)
        }
      }
      
      // NUEVOS MENSAJES
      if (msg.channel === 'new_message') {
        try {
          const messageData = JSON.parse(msg.payload || '{}')
          console.log('[MESSAGE-LISTENER] 📨 Nuevo mensaje detectado:', {
            id: messageData.id,
            conversation_id: messageData.conversation_id,
            sender: messageData.sender
          })

          // Desencriptar mensaje para Socket.IO
          let decryptedText = messageData.message
          try {
            const decrypted = decrypt(messageData.message)
            if (decrypted) {
              decryptedText = decrypted
              console.log('[MESSAGE-LISTENER] 🔓 Mensaje desencriptado')
            }
          } catch (error) {
            console.error('[MESSAGE-LISTENER] ❌ Error al desencriptar:', error)
          }

          const decryptedMessage = {
            ...messageData,
            message: decryptedText
          }

          // Emitir a la conversación específica
          const conversationRoom = `conversation_${messageData.conversation_id}`
          console.log('[MESSAGE-LISTENER] 📤 Emitiendo message:new a room:', conversationRoom)
          io.to(conversationRoom).emit('message:new', decryptedMessage)

          // Obtener user_id del bot para emitir actualización de conversación
          // (esto requiere una query, pero como es async podemos hacerlo)
          try {
            const pool = (await import('../config/database.js')).default
            const botResult = await pool.query(
              'SELECT user_id FROM bots WHERE id = $1',
              [messageData.bot_id]
            )
            
            if (botResult.rows.length > 0) {
              const userId = botResult.rows[0].user_id
              const userRoom = `user_${userId}`
              console.log('[MESSAGE-LISTENER] 📤 Emitiendo conversation:updated a room:', userRoom)
              
              io.to(userRoom).emit('conversation:updated', {
                conversationId: messageData.conversation_id,
                lastMessage: decryptedText,
                lastMessageTime: messageData.created_at,
                newMessage: decryptedMessage
              })
            }
          } catch (err) {
            console.error('[MESSAGE-LISTENER] ❌ Error al obtener user_id:', err)
          }

          console.log('[MESSAGE-LISTENER] ✅ Mensaje emitido vía Socket.IO')
        } catch (error) {
          console.error('[MESSAGE-LISTENER] ❌ Error procesando notificación:', error)
        }
      }
    })

    // Configurar LISTEN en los canales 'new_message' y 'new_conversation'
    await listenerClient.query('LISTEN new_message')
    await listenerClient.query('LISTEN new_conversation')
    console.log('[MESSAGE-LISTENER] ✅ Escuchando canales "new_message" y "new_conversation"')

    // Manejar errores de conexión
    listenerClient.on('error', (err) => {
      console.error('[MESSAGE-LISTENER] ❌ Error de conexión PostgreSQL:', err)
      // Intentar reconectar
      setTimeout(() => {
        console.log('[MESSAGE-LISTENER] 🔄 Intentando reconectar...')
        startMessageListener()
      }, 5000)
    })

  } catch (error) {
    console.error('[MESSAGE-LISTENER] ❌ Error al iniciar listener:', error)
    // Reintentar en 5 segundos
    setTimeout(() => {
      console.log('[MESSAGE-LISTENER] 🔄 Reintentando iniciar listener...')
      startMessageListener()
    }, 5000)
  }
}

/**
 * Detener listener de PostgreSQL
 */
export async function stopMessageListener() {
  if (listenerClient) {
    try {
      await listenerClient.query('UNLISTEN new_message')
      await listenerClient.query('UNLISTEN new_conversation')
      await listenerClient.end()
      console.log('[MESSAGE-LISTENER] 🛑 Listener detenido')
    } catch (error) {
      console.error('[MESSAGE-LISTENER] ❌ Error al detener listener:', error)
    }
    listenerClient = null
  }
}
