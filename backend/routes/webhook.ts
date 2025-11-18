// [TAG: Mensajes]
// [TAG: WebSocket]
// Webhook for receiving messages from Meta WhatsApp API

import express, { type Router } from "express"
import pool from "../config/database.js"
import { io } from "../server.js"
import { metaApiService } from "../services/meta-api.js"
import { encrypt, decrypt } from "../utils/message-decryption.js"
import { messageQueue } from "../services/message-queue.js"
import { webhookRateLimitMiddleware } from "../middleware/rate-limiter.js"
import { withDatabaseCircuitBreaker } from "../services/circuit-breaker.js"

const router: Router = express.Router()

// [TAG: Mensajes]
// POST /api/webhook/bot-message
// Receive inbound messages from Meta WhatsApp API
router.post("/bot-message", webhookRateLimitMiddleware, async (req, res) => {
  try {
    const webhookData = metaApiService.parseWebhook(req.body)

    if (!webhookData || !webhookData.message) {
      // Not a message webhook or no message content
      return res.sendStatus(200)
    }

    const { customerPhone, customerName, message, messageId, type, url } = webhookData

    // Extract key_bot from request (can be passed as query param or header)
    const keyBot = req.query.key_bot || req.headers["x-bot-key"]

    if (!keyBot) {
      return res.status(400).json({ error: "Bot key is required (key_bot query param or x-bot-key header)" })
    }

    // Generate unique task ID for queue
    const taskId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[WEBHOOK] 📥 Received message ${taskId} from ${customerPhone}`, {
      type: type || 'text',
      hasUrl: !!url,
      messagePreview: message?.substring(0, 50)
    })

    // Capture values for async processing (TypeScript type narrowing)
    const keyBotValue = keyBot as string
    const customerPhoneValue = customerPhone
    const customerNameValue = customerName
    const messageValue = message
    const messageIdValue = messageId
    const typeValue = type || 'text'
    const urlValue = url || null

    // Add to processing queue and respond immediately (async processing)
    // This prevents webhook timeout and allows handling high message volumes
    await messageQueue.add(taskId, async () => {
      await processIncomingMessage({
        keyBot: keyBotValue,
        customerPhone: customerPhoneValue,
        customerName: customerNameValue,
        message: messageValue,
        messageId: messageIdValue,
        type: typeValue,
        url: urlValue,
        taskId
      })
    })

    // Respond immediately with 202 Accepted
    // Actual processing happens in background queue
    return res.status(202).json({
      success: true,
      taskId,
      status: 'queued',
      message: 'Message queued for processing'
    })
  } catch (error) {
    console.error(`[WEBHOOK] ❌ Error queueing message:`, error)
    res.status(500).json({ error: "Internal server error" })
  }
})

/**
 * Process incoming message - extracted for better error handling and queue processing
 */
async function processIncomingMessage(params: {
  keyBot: string
  customerPhone: string
  customerName?: string | null
  message: string
  messageId?: string
  type?: string
  url?: string | null
  taskId: string
}) {
  const { keyBot, customerPhone, customerName, message, messageId, type, url, taskId } = params
  
  try {
    // Find bot by key_bot (using encrypted column) with circuit breaker
    const botResult = await withDatabaseCircuitBreaker(() =>
      pool.query("SELECT id, user_id, access_token_encrypted FROM bots WHERE key_bot_encrypted = $1", [keyBot])
    )

    if (botResult.rows.length === 0) {
      throw new Error(`Bot not found for key: ${keyBot}`)
    }

    const bot = botResult.rows[0]
    
    // Get real media URL if this is a multimedia message
    let mediaUrl = url
    if ((type === 'image' || type === 'video' || type === 'audio') && url) {
      console.log(`[WEBHOOK] ${taskId} Getting media URL for ${type} with ID:`, url)
      
      // Decrypt access token to call Meta API
      const { decrypt } = await import('../utils/message-decryption.js')
      const accessToken = decrypt(bot.access_token_encrypted)
      
      if (accessToken) {
        const realMediaUrl = await metaApiService.getMediaUrl(url, accessToken)
        if (realMediaUrl) {
          mediaUrl = realMediaUrl
          console.log(`[WEBHOOK] ${taskId} Media URL retrieved successfully`)
        } else {
          console.warn(`[WEBHOOK] ${taskId} Failed to get media URL, using media ID`)
        }
      }
    }

    // Find or create conversation with circuit breaker
    const conversationResult = await withDatabaseCircuitBreaker(() =>
      pool.query(
        "SELECT id FROM conversations WHERE bot_id = $1 AND customer_phone = $2",
        [bot.id, customerPhone],
      )
    )

    let conversationId: number

    if (conversationResult.rows.length === 0) {
      // Create new conversation with circuit breaker
      // El trigger de PostgreSQL notify_new_conversation() se encargará de emitir el evento
      const newConversation = await withDatabaseCircuitBreaker(() =>
        pool.query(
          `INSERT INTO conversations (bot_id, customer_phone, customer_name, created_at)
           VALUES ($1, $2, $3, NOW())
           RETURNING id`,
          [bot.id, customerPhone, customerName || null],
        )
      )
      conversationId = newConversation.rows[0].id
      console.log(`[WEBHOOK] ${taskId} Created new conversation:`, conversationId)
    } else {
      conversationId = conversationResult.rows[0].id

      // Update customer name if provided and different
      if (customerName) {
        await withDatabaseCircuitBreaker(() =>
          pool.query("UPDATE conversations SET customer_name = $1 WHERE id = $2", [customerName, conversationId])
        )
      }
    }

    // Check for duplicate message by messageId (idempotent) with circuit breaker
    if (messageId) {
      const existingMessage = await withDatabaseCircuitBreaker(() =>
        pool.query(
          "SELECT id FROM messages WHERE conversation_id = $1 AND message = $2 AND created_at > NOW() - INTERVAL '1 minute'",
          [conversationId, message],
        )
      )

      if (existingMessage.rows.length > 0) {
        console.log(`[WEBHOOK] ${taskId} Duplicate message detected, skipping:`, messageId)
        return
      }
    }

    // Encrypt message before saving to database
    const encryptedMessage = encrypt(message)

    // Insert message as sender='user' (customer sent this message) with circuit breaker
    const messageResult = await withDatabaseCircuitBreaker(() =>
      pool.query(
        `INSERT INTO messages (conversation_id, bot_id, sender, message, type, url, created_at)
         VALUES ($1, $2, 'user', $3, $4, $5, NOW())
         RETURNING id, conversation_id, bot_id, sender, message, type, url, created_at`,
        [conversationId, bot.id, encryptedMessage, type || 'text', mediaUrl || null],
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
        console.log("🔓 [WEBHOOK] Message decrypted successfully")
      }
    } catch (error) {
      console.error("❌ [WEBHOOK] Decryption error:", error)
      // Use original message from webhook
      decryptedText = message
    }
    
    const decryptedMessageForEmit = {
      ...newMessage,
      message: decryptedText,
      type: newMessage.type || 'text',
      url: newMessage.url || null
    }
    
    console.log("📤 [WEBHOOK] Emitting message:new to room:", `conversation_${conversationId}`)
    console.log("📤 [WEBHOOK] Message data:", {
      id: decryptedMessageForEmit.id,
      conversation_id: decryptedMessageForEmit.conversation_id,
      message: decryptedMessageForEmit.message,
      type: decryptedMessageForEmit.type,
      hasUrl: !!decryptedMessageForEmit.url,
      originalMessage: message
    })
    
    // Emit Socket.IO event to conversation room
    io.to(`conversation_${conversationId}`).emit("message:new", decryptedMessageForEmit)
    
    console.log("📤 [WEBHOOK] Emitting conversation:updated to room:", `user_${bot.user_id}`)
    
    // Emit global conversation update to user room for conversation list reordering
    io.to(`user_${bot.user_id}`).emit("conversation:updated", {
      conversationId,
      lastMessage: decryptedMessageForEmit.message,
      lastMessageTime: decryptedMessageForEmit.created_at,
      newMessage: decryptedMessageForEmit
    })

    console.log(`✅ [WEBHOOK] ${taskId} Message processed and emitted successfully`)
    
  } catch (error) {
    console.error(`❌ [WEBHOOK] ${taskId} Processing error:`, error)
    // Error will be handled by queue retry logic
    throw error
  }
}

// GET /api/webhook/bot-message (for Meta verification)
router.get("/bot-message", (req, res) => {
  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log("[v0] Webhook verified")
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
})

export default router
