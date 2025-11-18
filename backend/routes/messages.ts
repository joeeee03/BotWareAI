// [TAG: Mensajes]
// [TAG: WebSocket]
// Message sending route with Socket.IO integration

import express, { type Router } from "express"
import pool from "../config/database.js"
import { authenticateToken, type AuthRequest } from "../middleware/auth.js"
import { requirePasswordChange } from "../middleware/require-password-change.js"
import { io } from "../server.js"
import { metaApiService } from "../services/meta-api.js"
import { encrypt, decrypt } from "../utils/message-decryption.js"
import { withDatabaseCircuitBreaker, withMetaApiCircuitBreaker } from "../services/circuit-breaker.js"
import { replaceVariables } from "../utils/variable-replacer.js"

const router: Router = express.Router()

// [TAG: Mensajes]
// POST /api/send-message
// Send message to customer via Meta API
router.post("/send-message", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { conversationId, message } = req.body

  if (!conversationId || !message) {
    return res.status(400).json({ error: "Conversation ID and message required" })
  }

  try {
    const userId = req.user.user_id
    
    // Verify conversation belongs to user's bot and get bot credentials with circuit breaker
    const conversationResult = await withDatabaseCircuitBreaker(() =>
      pool.query(
        `SELECT 
          c.id,
          c.bot_id,
          c.customer_phone,
          c.customer_name,
          b.number_id_encrypted as phone_number_id,
          b.jwt_token_encrypted as access_token
        FROM conversations c
        JOIN bots b ON c.bot_id = b.id
        WHERE c.id = $1 AND b.user_id = $2`,
        [conversationId, userId],
      )
    )

    if (conversationResult.rows.length === 0) {
      return res.status(403).json({ error: "Access denied or conversation not found" })
    }

    const conversation = conversationResult.rows[0]

    // Decrypt bot credentials for Meta API
    const phoneNumberId = decrypt(conversation.phone_number_id)
    const accessToken = decrypt(conversation.access_token)

    if (!phoneNumberId || !accessToken) {
      console.error('[SEND-MESSAGE] Failed to decrypt bot credentials')
      return res.status(500).json({ error: 'Bot credentials error' })
    }

    console.log('[SEND-MESSAGE] Bot credentials decrypted successfully')

    // Replace variables with customer data
    const messageWithVariables = replaceVariables(message, {
      customer_name: conversation.customer_name,
      customer_phone: conversation.customer_phone
    })

    console.log('[SEND-MESSAGE] Variables replaced:', { 
      original: message,
      replaced: messageWithVariables
    })

    // Encrypt message before saving to database
    const encryptedMessage = encrypt(messageWithVariables)

    // Insert message into database as sender='bot' (bot sends to customer) with circuit breaker
    const messageResult = await withDatabaseCircuitBreaker(() =>
      pool.query(
        `INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
         VALUES ($1, $2, 'bot', $3, NOW())
         RETURNING id, conversation_id, bot_id, sender, message, created_at`,
        [conversationId, conversation.bot_id, encryptedMessage],
      )
    )

    const newMessage = messageResult.rows[0]

    // [TAG: WebSocket]
    // Decrypt message for Socket.IO emission (frontend needs decrypted version)
    let decryptedText = newMessage.message
    try {
      const decrypted = decrypt(newMessage.message)
      if (decrypted) {
        decryptedText = decrypted
        console.log("🔓 [SEND-MESSAGE] Message decrypted successfully")
      }
    } catch (error) {
      console.error("❌ [SEND-MESSAGE] Decryption error:", error)
      // Use original message (which should be the plain text 'message' variable)
      decryptedText = message
    }
    
    const decryptedMessageForEmit = {
      ...newMessage,
      message: decryptedText
    }
    
    console.log("📤 [SEND-MESSAGE] Message data:", {
      id: decryptedMessageForEmit.id,
      conversation_id: decryptedMessageForEmit.conversation_id,
      message: decryptedMessageForEmit.message,
      messageLength: decryptedMessageForEmit.message?.length,
    })
    
    // NO emitir aquí - el realtime-listener lo hará automáticamente cuando detecte el INSERT
    // Esto evita duplicados
    
    console.log("✅ [SEND-MESSAGE] Message saved to DB - realtime-listener will emit events")

    // Send to Meta API using decrypted credentials
    console.log('[SEND-MESSAGE] Sending to Meta API...', {
      phoneNumberId: phoneNumberId.substring(0, 10) + '...',
      to: conversation.customer_phone,
      messageLength: message.length
    })

    // Send to Meta API with circuit breaker protection (with variables replaced)
    const metaResponse = await withMetaApiCircuitBreaker(() =>
      metaApiService.sendTextMessage({
        phoneNumberId: phoneNumberId,
        accessToken: accessToken,
        to: conversation.customer_phone,
        message: messageWithVariables,
      })
    ).catch((error) => {
      // If circuit is open, return a safe fallback
      console.error("[SEND-MESSAGE] Meta API circuit breaker error:", error.message)
      return { success: false, error: error.message, messageId: undefined }
    })

    if (!metaResponse.success) {
      console.error("[SEND-MESSAGE] Meta API error:", metaResponse.error)
      // Don't fail the request - message is already stored
    } else {
      console.log("[SEND-MESSAGE] ✅ Message forwarded to Meta API successfully:", metaResponse.messageId)
    }

    res.json({
      success: true,
      message: newMessage,
      metaMessageId: metaResponse.messageId ?? null,
    })
  } catch (error) {
    console.error("[v0] Send message error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
