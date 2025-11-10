import type { Response, NextFunction } from "express"
import pool from "../config/database.js"
import type { AuthRequest } from "./auth.js"

// Middleware: if user's require_password_change is true, block access
export const requirePasswordChange = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "User not authenticated" })

  try {
    const result = await pool.query("SELECT require_password_change FROM users WHERE id = $1", [req.user.user_id])
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" })

    const flag = result.rows[0].require_password_change
    const requireChange = !!(
      flag === true ||
      flag === 't' ||
      flag === 'true' ||
      flag === 1 ||
      flag === '1' ||
      flag
    )

    if (requireChange) {
      return res.status(403).json({ error: "Password change required", code: "PASSWORD_CHANGE_REQUIRED" })
    }

    next()
  } catch (err) {
    console.error("[v0] requirePasswordChange middleware error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}
