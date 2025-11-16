// [TAG: Realtime]
// PostgreSQL LISTEN/NOTIFY para detectar nuevos mensajes en tiempo real
// Esto permite que CUALQUIER insert en la tabla messages emita eventos Socket.IO

import pkg from 'pg'
import { Server } from 'socket.io'
import { decrypt } from './utils/message-decryption.js'

const { Client } = pkg

export function startRealtimeListener(io: Server) {
  console.log('[REALTIME] Iniciando listener de PostgreSQL...')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  client.connect((err) => {
    if (err) {
      console.error('[REALTIME] Error conectando a PostgreSQL:', err)
      return
    }

    console.log('✅ [REALTIME] Conectado a PostgreSQL NOTIFY')
    console.log('🎯 [REALTIME] Sistema PROFESIONAL: detección INSTANTÁNEA de cambios')
    console.log('💡 [REALTIME] NO usa polling - PostgreSQL notifica automáticamente')

    // Escuchar notificaciones en el canal 'new_message'
    client.query('LISTEN new_message')
    console.log('👂 [REALTIME] Escuchando canal: new_message')
    
    // Escuchar notificaciones en el canal 'new_conversation'
    client.query('LISTEN new_conversation')
    console.log('👂 [REALTIME] Escuchando canal: new_conversation')
    
    console.log('🚀 [REALTIME] Sistema en tiempo real ACTIVO y esperando notificaciones...')

    client.on('notification', async (msg) => {
      if (msg.channel === 'new_message') {
        try {
          const payload = JSON.parse(msg.payload || '{}')
          console.log('📬 [REALTIME] Nueva notificación de mensaje:', payload.message_id)

          // Obtener información completa del mensaje y bot
          const query = `
            SELECT 
              m.id,
              m.conversation_id,
              m.bot_id,
              m.sender,
              m.message,
              m.created_at,
              b.user_id
            FROM messages m
            JOIN bots b ON m.bot_id = b.id
            WHERE m.id = $1
          `
          
          const result = await client.query(query, [payload.message_id])
          
          if (result.rows.length === 0) {
            console.log('⚠️ [REALTIME] Mensaje no encontrado:', payload.message_id)
            return
          }

          const messageData = result.rows[0]
          
          console.log(`📨 [REALTIME] Mensaje detectado - ID: ${messageData.id}, sender: ${messageData.sender}`)
          console.log('🔍 [REALTIME] Message from DB:', messageData.message.substring(0, 50) + '...')
          
          // Decrypt message using the same function as normal message loading
          const decryptedText = decrypt(messageData.message) || messageData.message
          
          console.log('🔓 [REALTIME] Decrypted text:', decryptedText)
          
          const decryptedMessage = {
            id: messageData.id,
            conversation_id: messageData.conversation_id,
            bot_id: messageData.bot_id,
            sender: messageData.sender,
            message: decryptedText,
            created_at: messageData.created_at
          }

          const conversationRoom = `conversation_${messageData.conversation_id}`
          const userRoom = `user_${messageData.user_id}`
          
          // Ver cuántos sockets están en cada room
          const socketsInConversation = await io.in(conversationRoom).fetchSockets()
          const socketsInUser = await io.in(userRoom).fetchSockets()
          
          console.log(`📤 [REALTIME] Emitiendo message:new a room: ${conversationRoom}`)
          console.log(`📊 [REALTIME] Sockets conectados en ${conversationRoom}: ${socketsInConversation.length}`)
          
          // Emit to conversation room (TODOS los usuarios viendo esta conversación)
          io.to(conversationRoom).emit('message:new', decryptedMessage)

          console.log(`📤 [REALTIME] Emitiendo conversation:updated a room: ${userRoom}`)
          console.log(`📊 [REALTIME] Sockets conectados en ${userRoom}: ${socketsInUser.length}`)
          
          // Emit to user room for conversation list update
          io.to(userRoom).emit('conversation:updated', {
            conversationId: messageData.conversation_id,
            lastMessage: decryptedMessage.message,
            lastMessageTime: decryptedMessage.created_at,
            newMessage: decryptedMessage
          })

          console.log('✅ [REALTIME] Eventos emitidos exitosamente para mensaje:', messageData.id)
          
          if (socketsInConversation.length === 0) {
            console.log('⚠️ [REALTIME] ADVERTENCIA: Nadie está conectado a esta conversación')
          }
          if (socketsInUser.length === 0) {
            console.log('⚠️ [REALTIME] ADVERTENCIA: El usuario no está conectado')
          }

        } catch (error) {
          console.error('[REALTIME] Error procesando notificación:', error)
        }
      } else if (msg.channel === 'new_conversation') {
        try {
          const payload = JSON.parse(msg.payload || '{}')
          console.log('📬 [REALTIME] Nueva notificación de conversación:', payload.conversation_id)

          // Obtener información completa de la conversación y bot
          const query = `
            SELECT 
              c.id,
              c.bot_id,
              c.customer_phone,
              c.customer_name,
              c.created_at,
              b.user_id
            FROM conversations c
            JOIN bots b ON c.bot_id = b.id
            WHERE c.id = $1
          `
          
          const result = await client.query(query, [payload.conversation_id])
          
          if (result.rows.length === 0) {
            console.log('⚠️ [REALTIME] Conversación no encontrada:', payload.conversation_id)
            return
          }

          const conversationData = result.rows[0]
          
          const newConversation = {
            id: conversationData.id,
            bot_id: conversationData.bot_id,
            customer_phone: conversationData.customer_phone,
            customer_name: conversationData.customer_name,
            created_at: conversationData.created_at,
            last_message: null,
            last_message_time: null
          }

          console.log('📤 [REALTIME] Emitiendo conversation:created a room:', `user_${conversationData.user_id}`)
          
          // Emit to user room for new conversation
          io.to(`user_${conversationData.user_id}`).emit('conversation:created', newConversation)

          console.log('✅ [REALTIME] Evento emitido exitosamente para conversación:', conversationData.id)

        } catch (error) {
          console.error('[REALTIME] Error procesando notificación de conversación:', error)
        }
      }
    })

    client.on('error', (err) => {
      console.error('[REALTIME] Error en cliente PostgreSQL:', err)
    })

    client.on('end', () => {
      console.log('[REALTIME] Conexión con PostgreSQL cerrada')
      // Intentar reconectar después de 5 segundos
      setTimeout(() => {
        console.log('[REALTIME] Intentando reconectar...')
        startRealtimeListener(io)
      }, 5000)
    })
  })

  return client
}
