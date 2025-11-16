// [TAG: Realtime]
// Polling system para detectar nuevos mensajes sin necesidad de triggers
// Este sistema consulta la BD periódicamente buscando mensajes nuevos

import pkg from 'pg'
import { Server } from 'socket.io'
import { decrypt } from '../utils/message-decryption.js'

const { Pool } = pkg

// Inicializar timestamp en el pasado para capturar mensajes existentes
let lastCheckedTimestamp = new Date(Date.now() - 60000) // 1 minuto atrás
let pollingInterval: NodeJS.Timeout | null = null

export function startMessagePolling(io: Server, intervalMs = 2000) {
  console.log('[MESSAGE-POLLING] 🔄 Iniciando polling de mensajes...')
  console.log('[MESSAGE-POLLING] ⏱️  Intervalo:', intervalMs, 'ms')
  console.log('[MESSAGE-POLLING] 📅 Timestamp inicial:', lastCheckedTimestamp.toISOString())

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  // Función que busca mensajes nuevos
  const checkForNewMessages = async () => {
    try {
      // Consultar mensajes creados después del último timestamp
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
        WHERE m.created_at > $1
        ORDER BY m.created_at ASC
      `
      
      const result = await pool.query(query, [lastCheckedTimestamp])
      
      console.log(`[MESSAGE-POLLING] 🔍 Consultando mensajes desde: ${lastCheckedTimestamp.toISOString()}`)
      console.log(`[MESSAGE-POLLING] 📊 Encontrados ${result.rows.length} mensajes nuevos`)
      
      if (result.rows.length > 0) {
        for (const messageData of result.rows) {
          console.log(`[MESSAGE-POLLING] 📨 Procesando mensaje ID: ${messageData.id}, sender: ${messageData.sender}`)
          
          // Desencriptar mensaje
          const decryptedText = decrypt(messageData.message) || messageData.message
          console.log(`[MESSAGE-POLLING] 🔓 Mensaje desencriptado: "${decryptedText.substring(0, 50)}..."`)
          
          const decryptedMessage = {
            id: messageData.id,
            conversation_id: messageData.conversation_id,
            bot_id: messageData.bot_id,
            sender: messageData.sender,
            message: decryptedText,
            created_at: messageData.created_at
          }

          // Emitir a la sala de conversación (TODOS los mensajes)
          const conversationRoom = `conversation_${messageData.conversation_id}`
          io.to(conversationRoom).emit('message:new', decryptedMessage)
          console.log(`[MESSAGE-POLLING] ✅ Emitido message:new a ${conversationRoom}`)

          // Emitir a la sala del usuario para actualizar lista de conversaciones
          const userRoom = `user_${messageData.user_id}`
          io.to(userRoom).emit('conversation:updated', {
            conversationId: messageData.conversation_id,
            lastMessage: decryptedMessage.message,
            lastMessageTime: decryptedMessage.created_at,
            newMessage: decryptedMessage
          })
          console.log(`[MESSAGE-POLLING] ✅ Emitido conversation:updated a ${userRoom}`)
          
          // Actualizar último timestamp procesado
          lastCheckedTimestamp = new Date(messageData.created_at)
          console.log(`[MESSAGE-POLLING] 📅 Timestamp actualizado a: ${lastCheckedTimestamp.toISOString()}`)
        }
      }
      
    } catch (error) {
      console.error('[MESSAGE-POLLING] ❌ Error en polling:', error)
    }
  }

  // Función que busca conversaciones nuevas
  const checkForNewConversations = async () => {
    try {
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
        WHERE c.created_at > $1
        ORDER BY c.created_at ASC
      `
      
      const result = await pool.query(query, [lastCheckedTimestamp])
      
      if (result.rows.length > 0) {
        console.log(`[MESSAGE-POLLING] 🆕 Encontradas ${result.rows.length} conversaciones nuevas`)
        
        for (const conversationData of result.rows) {
          const newConversation = {
            id: conversationData.id,
            bot_id: conversationData.bot_id,
            customer_phone: conversationData.customer_phone,
            customer_name: conversationData.customer_name,
            created_at: conversationData.created_at,
            last_message: null,
            last_message_time: null
          }

          // Emitir a la sala del usuario
          io.to(`user_${conversationData.user_id}`).emit('conversation:created', newConversation)
          console.log(`[MESSAGE-POLLING] ✅ Nueva conversación emitida a user_${conversationData.user_id}`)
        }
      }
      
    } catch (error) {
      console.error('[MESSAGE-POLLING] ❌ Error buscando conversaciones:', error)
    }
  }

  // Ejecutar polling cada X segundos
  pollingInterval = setInterval(async () => {
    await checkForNewMessages()
    await checkForNewConversations()
  }, intervalMs)

  console.log('[MESSAGE-POLLING] ✅ Polling iniciado exitosamente')
  console.log('[MESSAGE-POLLING] 📡 Sistema en tiempo real activo sin triggers')

  // Cleanup function
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      console.log('[MESSAGE-POLLING] 🛑 Polling detenido')
    }
    pool.end()
  }
}

export function stopMessagePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
    console.log('[MESSAGE-POLLING] 🛑 Polling detenido')
  }
}
