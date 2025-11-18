// [TAG: Scheduled Messages]
// [TAG: WhatsApp]
// Service that runs periodically to send scheduled messages

import pool from "../config/database.js"
import { metaApiService } from "./meta-api.js"
import { decrypt, encrypt } from "../utils/message-decryption.js"
import { io } from "../server.js"
import { replaceVariables } from "../utils/variable-replacer.js"

const SCHEDULER_INTERVAL_MS = 60000 // Check every 1 minute

export function startMessageScheduler() {
  console.log('[MESSAGE-SCHEDULER] 🕐 Starting message scheduler...')
  console.log(`[MESSAGE-SCHEDULER] Will check for pending messages every ${SCHEDULER_INTERVAL_MS / 1000} seconds`)

  // Run immediately on startup
  processScheduledMessages()

  // Then run periodically
  setInterval(() => {
    processScheduledMessages()
  }, SCHEDULER_INTERVAL_MS)
}

async function processScheduledMessages() {
  try {
    // Get all pending messages that are due to be sent
    const result = await pool.query(
      `SELECT 
        sm.id,
        sm.user_id,
        sm.bot_id,
        sm.conversation_ids,
        sm.message,
        sm.scheduled_for,
        b.jwt_token_encrypted,
        b.number_id_encrypted
       FROM scheduled_messages sm
       JOIN bots b ON sm.bot_id = b.id
       WHERE sm.status = 'pending' 
         AND sm.scheduled_for <= NOW()
       ORDER BY sm.scheduled_for ASC
       LIMIT 100` // Process max 100 messages per cycle to avoid overload
    )

    if (result.rows.length === 0) {
      console.log('[MESSAGE-SCHEDULER] ✅ No pending messages to send')
      return
    }

    console.log(`[MESSAGE-SCHEDULER] 📨 Found ${result.rows.length} messages to send`)

    for (const scheduledMsg of result.rows) {
      await sendScheduledMessage(scheduledMsg)
    }
  } catch (error) {
    console.error('[MESSAGE-SCHEDULER] ❌ Error processing scheduled messages:', error)
  }
}

async function sendScheduledMessage(scheduledMsg: any) {
  const { id, conversation_ids, message, jwt_token_encrypted, number_id_encrypted } = scheduledMsg

  try {
    console.log(`[MESSAGE-SCHEDULER] 📤 Sending scheduled message ${id} to ${conversation_ids.length} conversation(s)`)

    // Decrypt WhatsApp tokens
    const jwtToken = decrypt(jwt_token_encrypted)
    const numberId = decrypt(number_id_encrypted)

    let successCount = 0
    let errorMessages: string[] = []

    // Send to each conversation
    for (const conversationId of conversation_ids) {
      try {
        // Get customer data from conversation
        const convResult = await pool.query(
          'SELECT customer_phone, customer_name FROM conversations WHERE id = $1',
          [conversationId]
        )

        if (convResult.rows.length === 0) {
          console.log(`[MESSAGE-SCHEDULER] ⚠️ Conversation ${conversationId} not found, skipping`)
          errorMessages.push(`Conversation ${conversationId} not found`)
          continue
        }

        const { customer_phone: customerPhone, customer_name: customerName } = convResult.rows[0]

        // Replace variables with customer data for personalized message
        const personalizedMessage = replaceVariables(message, {
          customer_name: customerName,
          customer_phone: customerPhone
        })

        console.log(`[MESSAGE-SCHEDULER] 🔄 Message personalized for ${customerName || customerPhone}:`, {
          original: message,
          personalized: personalizedMessage
        })

        // Send via WhatsApp API using metaApiService with personalized message
        const metaResponse = await metaApiService.sendTextMessage({
          phoneNumberId: numberId,
          accessToken: jwtToken,
          to: customerPhone,
          message: personalizedMessage,
        })

        if (!metaResponse.success) {
          throw new Error(metaResponse.error || 'Failed to send message')
        }

        // Encrypt personalized message before saving to database
        const encryptedMessage = encrypt(personalizedMessage)

        // Save personalized message to database
        const messageResult = await pool.query(
          `INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
           VALUES ($1, $2, 'bot', $3, NOW())
           RETURNING id, conversation_id, bot_id, sender, message, created_at`,
          [conversationId, scheduledMsg.bot_id, encryptedMessage]
        )

        const newMessage = messageResult.rows[0]

        // Emit Socket.IO events for real-time updates
        const decryptedMessage = {
          ...newMessage,
          message: personalizedMessage // Use personalized message for frontend
        }

        // Emit to conversation room
        io.to(`conversation_${conversationId}`).emit("message:new", decryptedMessage)
        
        // Emit to user room for conversation list update
        io.to(`user_${scheduledMsg.user_id}`).emit("conversation:updated", {
          conversationId,
          lastMessage: personalizedMessage,
          lastMessageTime: newMessage.created_at,
          newMessage: decryptedMessage
        })

        successCount++
        console.log(`[MESSAGE-SCHEDULER] ✅ Sent to conversation ${conversationId}`)
      } catch (error: any) {
        console.error(`[MESSAGE-SCHEDULER] ❌ Error sending to conversation ${conversationId}:`, error)
        errorMessages.push(`Conv ${conversationId}: ${error.message}`)
      }
    }

    // Update scheduled message status
    if (successCount === conversation_ids.length) {
      // All sent successfully
      await pool.query(
        `UPDATE scheduled_messages
         SET status = 'sent', sent_at = NOW()
         WHERE id = $1`,
        [id]
      )
      console.log(`[MESSAGE-SCHEDULER] ✅ Scheduled message ${id} sent successfully to all ${successCount} conversations`)
    } else if (successCount > 0) {
      // Partial success
      await pool.query(
        `UPDATE scheduled_messages
         SET status = 'sent', sent_at = NOW(), error_message = $1
         WHERE id = $2`,
        [`Sent to ${successCount}/${conversation_ids.length}. Errors: ${errorMessages.join('; ')}`, id]
      )
      console.log(`[MESSAGE-SCHEDULER] ⚠️ Scheduled message ${id} sent to ${successCount}/${conversation_ids.length} conversations`)
    } else {
      // Complete failure
      await pool.query(
        `UPDATE scheduled_messages
         SET status = 'failed', error_message = $1
         WHERE id = $2`,
        [errorMessages.join('; '), id]
      )
      console.log(`[MESSAGE-SCHEDULER] ❌ Scheduled message ${id} failed completely`)
    }
  } catch (error: any) {
    console.error(`[MESSAGE-SCHEDULER] ❌ Error sending scheduled message ${id}:`, error)
    
    // Mark as failed
    await pool.query(
      `UPDATE scheduled_messages
       SET status = 'failed', error_message = $1
       WHERE id = $2`,
      [error.message, id]
    )
  }
}
