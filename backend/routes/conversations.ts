// [TAG: Mensajes]
// [TAG: DB]
// Conversation and message routes

import express, { type Router } from "express"
import pool from "../config/database.js"
import { authenticateToken, type AuthRequest } from "../middleware/auth.js"
import { requirePasswordChange } from "../middleware/require-password-change.js"
import { decryptConversations, decryptMessages } from "../utils/message-decryption.js"

const router: Router = express.Router()

// [TAG: Mensajes]
// GET /api/conversations
// Get all conversations for user's bots, ordered by most recent message
router.get("/", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { limit = 50, offset = 0 } = req.query

  try {
    // Get conversations for all user's bots with latest message info
    const conversationsResult = await pool.query(
      `SELECT 
        c.id,
        c.bot_id,
        c.customer_phone,
        c.customer_name,
        c.created_at,
        b.key_bot_encrypted as key_bot,
        b.number_id_encrypted as phone_number_id,
        (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.user_id = $1
      ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.user_id, limit, offset],
    )

    // Decrypt the last_message field in conversations
    const decryptedConversations = decryptConversations(conversationsResult.rows)

    res.json({
      conversations: decryptedConversations,
      total: decryptedConversations.length,
    })
  } catch (error) {
    console.error("[v0] Get conversations error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Mensajes]
// GET /api/conversations/:conversationId/messages
// Get messages for a specific conversation (ordered ASC by created_at)
router.get("/:conversationId/messages", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { conversationId } = req.params
  const { limit = 50, cursor } = req.query  // Cargar últimos 50 mensajes por defecto
  
  console.log(`[MESSAGES] 📨 Loading messages for conversation ${conversationId}, user ${req.user.user_id}`)
  console.log(`[MESSAGES] 📊 Limit: ${limit}, Cursor: ${cursor || 'none'}`)

  try {
    // First verify that the conversation belongs to user's bot
    const ownershipCheck = await pool.query(
      `SELECT c.id 
       FROM conversations c
       JOIN bots b ON c.bot_id = b.id
       WHERE c.id = $1 AND b.user_id = $2`,
      [conversationId, req.user.user_id],
    )

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied to this conversation" })
    }

    // Get messages - IMPORTANTE: traer los ÚLTIMOS X mensajes, no los primeros
    let query
    let params

    if (cursor) {
      // Con cursor: traer mensajes DESPUÉS del cursor
      query = `SELECT id, sender, message, created_at 
               FROM messages 
               WHERE conversation_id = $1 AND created_at > $2
               ORDER BY created_at ASC 
               LIMIT $3`
      params = [conversationId, cursor, limit]
    } else {
      // Sin cursor: traer los ÚLTIMOS X mensajes (subquery DESC + LIMIT, luego ASC)
      query = `
        SELECT id, sender, message, created_at 
        FROM (
          SELECT id, sender, message, created_at 
          FROM messages 
          WHERE conversation_id = $1
          ORDER BY created_at DESC 
          LIMIT $2
        ) AS latest_messages
        ORDER BY created_at ASC
      `
      params = [conversationId, limit]
    }

    const messagesResult = await pool.query(query, params)
    console.log(`[MESSAGES] 📊 Found ${messagesResult.rows.length} messages in DB for conversation ${conversationId}`)
    if (messagesResult.rows.length > 0) {
      console.log(`[MESSAGES] 📅 First message date: ${messagesResult.rows[0].created_at}`)
      console.log(`[MESSAGES] 📅 Last message date: ${messagesResult.rows[messagesResult.rows.length - 1].created_at}`)
    }

    // Decrypt messages before sending to frontend
    const decryptedMessages = decryptMessages(messagesResult.rows)
    console.log(`[MESSAGES] 🔓 Decrypted ${decryptedMessages.length} messages`)
    console.log(`[MESSAGES] ✅ Sending messages to frontend`)

    res.json({
      messages: decryptedMessages,
      nextCursor:
        decryptedMessages.length > 0 ? decryptedMessages[decryptedMessages.length - 1].created_at : null,
    })
  } catch (error) {
    console.error("[v0] Get messages error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Mensajes]
// GET /api/conversations/:conversationId
// Get single conversation details
router.get("/:conversationId", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { conversationId } = req.params

  try {
    const conversationResult = await pool.query(
      `SELECT 
        c.id,
        c.bot_id,
        c.customer_phone,
        c.customer_name,
        c.created_at,
        b.key_bot_encrypted as key_bot,
        b.number_id_encrypted as phone_number_id
      FROM conversations c
      JOIN bots b ON c.bot_id = b.id
      WHERE c.id = $1 AND b.user_id = $2`,
      [conversationId, req.user.user_id],
    )

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" })
    }

    res.json({ conversation: conversationResult.rows[0] })
  } catch (error) {
    console.error("[v0] Get conversation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
