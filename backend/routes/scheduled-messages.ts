// [TAG: Scheduled Messages]
// [TAG: DB]
// Scheduled messages routes

import express, { type Router } from "express"
import pool from "../config/database.js"
import { authenticateToken, type AuthRequest } from "../middleware/auth.js"
import { requirePasswordChange } from "../middleware/require-password-change.js"

const router: Router = express.Router()

// [TAG: Scheduled Messages]
// GET /api/scheduled-messages
// Get all scheduled messages for the authenticated user
router.get("/", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { status } = req.query

  try {
    let query = `
      SELECT 
        sm.id, 
        sm.bot_id, 
        sm.conversation_ids, 
        sm.message, 
        sm.scheduled_for,
        sm.status, 
        sm.sent_at, 
        sm.error_message, 
        sm.created_at,
        b.key_bot_encrypted as bot_key
      FROM scheduled_messages sm
      JOIN bots b ON sm.bot_id = b.id
      WHERE sm.user_id = $1
    `
    const params: any[] = [req.user.user_id]

    // Filtrar por status si se proporciona
    if (status) {
      query += ` AND sm.status = $2`
      params.push(status)
    }

    query += ` ORDER BY sm.scheduled_for DESC`

    const result = await pool.query(query, params)

    res.json({
      scheduled_messages: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error("[SCHEDULED-MESSAGES] Error fetching scheduled messages:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Scheduled Messages]
// POST /api/scheduled-messages
// Create a new scheduled message
router.post("/", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { bot_id, conversation_ids, message, scheduled_for } = req.body

  // Validaciones
  if (!bot_id || !conversation_ids || !message || !scheduled_for) {
    return res.status(400).json({ 
      error: "bot_id, conversation_ids, message, and scheduled_for are required" 
    })
  }

  if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
    return res.status(400).json({ error: "conversation_ids must be a non-empty array" })
  }

  // Validar que la fecha programada sea futura
  const scheduledDate = new Date(scheduled_for)
  if (scheduledDate <= new Date()) {
    return res.status(400).json({ error: "scheduled_for must be a future date" })
  }

  try {
    // Verificar que el bot pertenece al usuario
    const botCheck = await pool.query(
      `SELECT id FROM bots WHERE id = $1 AND user_id = $2`,
      [bot_id, req.user.user_id]
    )

    if (botCheck.rows.length === 0) {
      return res.status(404).json({ error: "Bot not found" })
    }

    // Verificar que todas las conversaciones existen y pertenecen al bot
    const conversationsCheck = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = ANY($1::int[]) AND bot_id = $2`,
      [conversation_ids, bot_id]
    )

    if (conversationsCheck.rows.length !== conversation_ids.length) {
      return res.status(400).json({ error: "Some conversations do not exist or do not belong to this bot" })
    }

    const result = await pool.query(
      `INSERT INTO scheduled_messages (user_id, bot_id, conversation_ids, message, scheduled_for)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, bot_id, conversation_ids, message, scheduled_for, status, created_at`,
      [req.user.user_id, bot_id, conversation_ids, message, scheduled_for]
    )

    console.log(`[SCHEDULED-MESSAGES] User ${req.user.user_id} scheduled message for ${scheduled_for}`)

    res.status(201).json({
      scheduled_message: result.rows[0],
      message: "Message scheduled successfully"
    })
  } catch (error) {
    console.error("[SCHEDULED-MESSAGES] Error creating scheduled message:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Scheduled Messages]
// PUT /api/scheduled-messages/:id
// Update a scheduled message (only if status is 'pending')
router.put("/:id", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { id } = req.params
  const { conversation_ids, message, scheduled_for } = req.body

  // Validaciones
  if (!conversation_ids || !message || !scheduled_for) {
    return res.status(400).json({ 
      error: "conversation_ids, message, and scheduled_for are required" 
    })
  }

  if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
    return res.status(400).json({ error: "conversation_ids must be a non-empty array" })
  }

  // Validar que la fecha programada sea futura
  const scheduledDate = new Date(scheduled_for)
  if (scheduledDate <= new Date()) {
    return res.status(400).json({ error: "scheduled_for must be a future date" })
  }

  try {
    // Verificar que el mensaje programado pertenece al usuario y está pendiente
    const ownershipCheck = await pool.query(
      `SELECT id, bot_id, status FROM scheduled_messages 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    )

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: "Scheduled message not found" })
    }

    if (ownershipCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ error: "Cannot update a message that is not pending" })
    }

    const botId = ownershipCheck.rows[0].bot_id

    // Verificar que todas las conversaciones existen y pertenecen al bot
    const conversationsCheck = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = ANY($1::int[]) AND bot_id = $2`,
      [conversation_ids, botId]
    )

    if (conversationsCheck.rows.length !== conversation_ids.length) {
      return res.status(400).json({ error: "Some conversations do not exist or do not belong to this bot" })
    }

    const result = await pool.query(
      `UPDATE scheduled_messages
       SET conversation_ids = $1, message = $2, scheduled_for = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, bot_id, conversation_ids, message, scheduled_for, status, created_at, updated_at`,
      [conversation_ids, message, scheduled_for, id, req.user.user_id]
    )

    console.log(`[SCHEDULED-MESSAGES] User ${req.user.user_id} updated scheduled message ${id}`)

    res.json({
      scheduled_message: result.rows[0],
      message: "Scheduled message updated successfully"
    })
  } catch (error) {
    console.error("[SCHEDULED-MESSAGES] Error updating scheduled message:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Scheduled Messages]
// DELETE /api/scheduled-messages/:id
// Cancel a scheduled message (only if status is 'pending')
router.delete("/:id", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { id } = req.params

  try {
    // Verificar que el mensaje programado pertenece al usuario y está pendiente
    const ownershipCheck = await pool.query(
      `SELECT status FROM scheduled_messages 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    )

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: "Scheduled message not found" })
    }

    if (ownershipCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ error: "Cannot cancel a message that is not pending" })
    }

    // Marcar como cancelado en lugar de eliminar (para mantener historial)
    await pool.query(
      `UPDATE scheduled_messages
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    )

    console.log(`[SCHEDULED-MESSAGES] User ${req.user.user_id} cancelled scheduled message ${id}`)

    res.json({ message: "Scheduled message cancelled successfully" })
  } catch (error) {
    console.error("[SCHEDULED-MESSAGES] Error cancelling scheduled message:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
