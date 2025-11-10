// [TAG: DB]
// Bot management routes

import express, { type Router } from "express"
import pool from "../config/database.js"
import { authenticateToken, type AuthRequest } from "../middleware/auth.js"
import { requirePasswordChange } from "../middleware/require-password-change.js"

const router: Router = express.Router()

// [TAG: DB]
// GET /api/bots
// Get all bots for authenticated user
router.get("/", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  try {
    const botsResult = await pool.query(
      "SELECT id, key_bot_encrypted as key_bot, number_id_encrypted as phone_number_id, created_at FROM bots WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.user_id],
    )

    res.json({ bots: botsResult.rows })
  } catch (error) {
    console.error("[v0] Get bots error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: DB]
// POST /api/bots
// Create new bot
router.post("/", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { key_bot, phone_number_id, access_token } = req.body

  if (!key_bot || !phone_number_id || !access_token) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try {
    // Insert usando los nombres de columna REALES de tu base de datos
    const botResult = await pool.query(
      `INSERT INTO bots (user_id, key_bot_encrypted, number_id_encrypted, jwt_token_encrypted, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, key_bot_encrypted as key_bot, number_id_encrypted as phone_number_id, created_at`,
      [req.user.user_id, key_bot, phone_number_id, access_token],
    )

    res.status(201).json({ bot: botResult.rows[0] })
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique violation
      return res.status(409).json({ error: "Bot key already exists" })
    }
    console.error("[v0] Create bot error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
