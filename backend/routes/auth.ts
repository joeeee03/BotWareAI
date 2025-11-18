// [TAG: Autenticación]
// [TAG: Seguridad]
// Authentication routes: login and password change

import express, { type Router } from "express"
import * as fs from "fs"
import * as path from "path"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../config/database.js"
import { authenticateToken, type AuthRequest } from "../middleware/auth.js"
import { hashPassword, verifyPassword } from "../utils/encryption.js"

const router: Router = express.Router()

// Temporary password constant
const TEMPORARY_PASSWORD = "BotWhatsapp!"

// [TAG: Autenticación]
// POST /api/auth/login
// Authenticate user and return JWT token with bots list
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" })
  }

  try {
    // Find user by email (include require_password_change flag)
    const userResult = await pool.query(
      "SELECT id, email, password_hash, require_password_change FROM users WHERE email = $1",
      [email],
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = userResult.rows[0]

    // DEBUG: log the retrieved user row so we can verify the DB returned the require_password_change flag
    try {
      console.log(`[v0] Login: DATABASE_URL set=${!!process.env.DATABASE_URL}`)
      // Avoid logging full DATABASE_URL (secrets) — just show whether it's present and the host portion if any
      if (process.env.DATABASE_URL) {
        try {
          const url = new URL(process.env.DATABASE_URL)
          console.log(`[v0] Login: connecting to DB host=${url.hostname}`)
        } catch (e) {
          console.log(`[v0] Login: DATABASE_URL present but couldn't parse host`)
        }
      }
      console.log("[v0] Login: user row returned:", user)
    } catch (e) {
      // swallow debug logging errors
    }

    // Verify password with bcrypt (secure one-way hashing)
    // DEBUG: log lengths/types to help debug password verification
    try {
      const debugLine = `[${new Date().toISOString()}] Login DEBUG: email=${email} password_len=${typeof password === 'string' ? password.length : typeof password} stored_hash_len=${user.password_hash ? user.password_hash.length : 'null'}\n`
      fs.appendFileSync(path.join(__dirname, '..', '..', 'backend-login-debug.log'), debugLine)
    } catch (e) {
      // ignore
    }

    let isPasswordValid = false
    
    // Try bcrypt verification first (new secure method)
    try {
      isPasswordValid = await verifyPassword(password, user.password_hash)
    } catch (error) {
      // If bcrypt fails, try old AES method for backward compatibility during migration
      console.log('[v0] Bcrypt verification failed, trying legacy AES for backward compatibility')
      try {
        // Import the old AES functions for migration
        const { decrypt } = await import('../utils/encryption.js')
        const decryptedPassword = decrypt(user.password_hash)
        isPasswordValid = password === decryptedPassword
        
        // If AES works, migrate to bcrypt
        if (isPasswordValid) {
          console.log('[v0] Migrating password from AES to bcrypt for user:', email)
          const newHash = await hashPassword(password)
          await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id])
          console.log('[v0] Password migrated to bcrypt successfully')
        }
      } catch (aesError) {
        console.error('[v0] Both bcrypt and AES verification failed:', aesError)
        isPasswordValid = false
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

  // Determine whether user must change password on first login.
  // Coerce various possible PG representations ('t', 'true', 1, true) to boolean.
  const requirePasswordChange = !!(
    user.require_password_change === true ||
    user.require_password_change === 't' ||
    user.require_password_change === 'true' ||
    user.require_password_change === 1 ||
    user.require_password_change === '1' ||
    user.require_password_change
  )

    // Get user's bots (using encrypted column names)
    const botsResult = await pool.query(
      "SELECT id, key_bot_encrypted as key_bot, number_id_encrypted as phone_number_id, created_at FROM bots WHERE user_id = $1",
      [user.id],
    )

    // Generate JWT token (expires in 7 days)
    const jwtSecret = (process.env.JWT_SECRET || "") as jwt.Secret
    const signOptions: jwt.SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN as any) || "7d" }
    const token = jwt.sign({ user_id: user.id, email: user.email }, jwtSecret, signOptions)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
      bots: botsResult.rows,
      requirePasswordChange,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Autenticación]
// [TAG: Seguridad]
// POST /api/auth/change-password
// Change user password (requires authentication)
router.post("/change-password", authenticateToken, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: "New password required (minimum 8 characters)",
    })
  }

  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  try {
    // Verify current password if provided
    const userResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.user_id])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const storedHash = userResult.rows[0].password_hash

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password required" })
    }

    // Verify current password (try bcrypt first, fallback to AES for migration)
    let isCurrentValid = false
    try {
      isCurrentValid = await verifyPassword(currentPassword, storedHash)
    } catch (error) {
      // Fallback to legacy AES for migration
      try {
        const { decrypt } = await import('../utils/encryption.js')
        const decryptedPassword = decrypt(storedHash)
        isCurrentValid = currentPassword === decryptedPassword
      } catch (aesError) {
        console.error('[v0] Password verification failed:', aesError)
      }
    }
    
    if (!isCurrentValid) {
      return res.status(401).json({ error: "Current password is incorrect" })
    }

    // Hash new password with bcrypt (secure one-way hashing)
    const newPasswordHash = await hashPassword(newPassword)

    // Update password in database and clear the require_password_change flag
    await pool.query(
      "UPDATE users SET password_hash = $1, require_password_change = false WHERE id = $2",
      [newPasswordHash, req.user.user_id],
    )

    res.json({ ok: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Password change error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: Autenticación]
// GET /api/auth/me
// Get current user info (requires authentication)
router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  try {
    const userResult = await pool.query("SELECT id, email, display_name, created_at, require_password_change FROM users WHERE id = $1", [req.user.user_id])

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = userResult.rows[0]
    
    // Coerce require_password_change to boolean
    const requirePasswordChange = !!(
      user.require_password_change === true ||
      user.require_password_change === 't' ||
      user.require_password_change === 'true' ||
      user.require_password_change === 1 ||
      user.require_password_change === '1' ||
      user.require_password_change
    )

    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at,
        requirePasswordChange
      }
    })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Development helper: return user row for given email (ONLY when not in production)
router.get("/debug-user", async (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(404).end()
  const { email } = req.query
  if (!email || typeof email !== "string") return res.status(400).json({ error: "email query param required" })
  try {
    const result = await pool.query("SELECT id, email, require_password_change FROM users WHERE email = $1", [email])
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" })
    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error("[v0] debug-user error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

// [TAG: User Profile]
// PUT /api/auth/update-profile
// Update user profile (display name)
router.put("/update-profile", authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const { display_name } = req.body

  if (!display_name || typeof display_name !== 'string') {
    return res.status(400).json({ error: "display_name is required" })
  }

  if (display_name.length > 100) {
    return res.status(400).json({ error: "display_name must be 100 characters or less" })
  }

  try {
    const result = await pool.query(
      `UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name`,
      [display_name, req.user.user_id]
    )

    console.log(`[AUTH] User ${req.user.user_id} updated display name to: ${display_name}`)

    res.json({
      user: result.rows[0],
      message: "Profile updated successfully"
    })
  } catch (error) {
    console.error("[AUTH] Error updating profile:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
