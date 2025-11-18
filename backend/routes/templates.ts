// [TAG: Templates]
// [TAG: DB]
// Quick reply templates routes

import express, { type Router } from "express"
import pool from "../config/database.js"
import { authenticateToken, type AuthRequest } from "../middleware/auth.js"
import { requirePasswordChange } from "../middleware/require-password-change.js"

const router: Router = express.Router()

// [TAG: Templates]
// GET /api/templates
// Get all templates for the authenticated user
router.get("/", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  try {
    const result = await pool.query(
      `SELECT id, title, message, shortcut, category, created_at, updated_at
       FROM quick_reply_templates
       WHERE user_id = $1
       ORDER BY category, title ASC`,
      [req.user.user_id]
    )

    res.json({
      templates: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error("[TEMPLATES] Error fetching templates:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Templates]
// POST /api/templates
// Create a new template
router.post("/", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { title, message, shortcut, category } = req.body

  // Validaciones
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" })
  }

  if (title.length > 100) {
    return res.status(400).json({ error: "Title must be 100 characters or less" })
  }

  if (shortcut && shortcut.length > 20) {
    return res.status(400).json({ error: "Shortcut must be 20 characters or less" })
  }

  try {
    // Verificar si el shortcut ya existe para este usuario
    if (shortcut) {
      const existingShortcut = await pool.query(
        `SELECT id FROM quick_reply_templates 
         WHERE user_id = $1 AND shortcut = $2`,
        [req.user.user_id, shortcut]
      )

      if (existingShortcut.rows.length > 0) {
        return res.status(400).json({ error: "Shortcut already exists" })
      }
    }

    const result = await pool.query(
      `INSERT INTO quick_reply_templates (user_id, title, message, shortcut, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, message, shortcut, category, created_at, updated_at`,
      [req.user.user_id, title, message, shortcut || null, category || null]
    )

    console.log(`[TEMPLATES] User ${req.user.user_id} created template: ${title}`)

    res.status(201).json({
      template: result.rows[0],
      message: "Template created successfully"
    })
  } catch (error) {
    console.error("[TEMPLATES] Error creating template:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Templates]
// PUT /api/templates/:id
// Update an existing template
router.put("/:id", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { id } = req.params
  const { title, message, shortcut, category } = req.body

  // Validaciones
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" })
  }

  if (title.length > 100) {
    return res.status(400).json({ error: "Title must be 100 characters or less" })
  }

  if (shortcut && shortcut.length > 20) {
    return res.status(400).json({ error: "Shortcut must be 20 characters or less" })
  }

  try {
    // Verificar que el template pertenece al usuario
    const ownershipCheck = await pool.query(
      `SELECT id FROM quick_reply_templates 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    )

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" })
    }

    // Verificar si el shortcut ya existe para otro template
    if (shortcut) {
      const existingShortcut = await pool.query(
        `SELECT id FROM quick_reply_templates 
         WHERE user_id = $1 AND shortcut = $2 AND id != $3`,
        [req.user.user_id, shortcut, id]
      )

      if (existingShortcut.rows.length > 0) {
        return res.status(400).json({ error: "Shortcut already exists" })
      }
    }

    const result = await pool.query(
      `UPDATE quick_reply_templates
       SET title = $1, message = $2, shortcut = $3, category = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, title, message, shortcut, category, created_at, updated_at`,
      [title, message, shortcut || null, category || null, id, req.user.user_id]
    )

    console.log(`[TEMPLATES] User ${req.user.user_id} updated template ${id}`)

    res.json({
      template: result.rows[0],
      message: "Template updated successfully"
    })
  } catch (error) {
    console.error("[TEMPLATES] Error updating template:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Templates]
// DELETE /api/templates/:id
// Delete a template
router.delete("/:id", authenticateToken, requirePasswordChange, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM quick_reply_templates
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.user_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" })
    }

    console.log(`[TEMPLATES] User ${req.user.user_id} deleted template ${id}`)

    res.json({ message: "Template deleted successfully" })
  } catch (error) {
    console.error("[TEMPLATES] Error deleting template:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
