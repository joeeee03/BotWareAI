// [TAG: Multimedia]
// Routes for uploading images and videos

import express, { type Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { authenticateToken, type AuthRequest } from "../middleware/auth.js"
import { requirePasswordChange } from "../middleware/require-password-change.js"

const router: Router = express.Router()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "public", "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log("[UPLOAD] Created uploads directory:", uploadsDir)
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const prefix = file.mimetype.startsWith("image/") ? "BOT_IMG" : "BOT_VID"
    const filename = `${prefix}_${Date.now()}${ext}`
    cb(null, filename)
  },
})

// File filter for images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"]
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`))
  }
}

// Multer upload configuration with size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
})

// POST /api/upload/image
// Upload image file and return public URL
router.post("/image", authenticateToken, requirePasswordChange, upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo" })
    }

    // Generate public URL
    const protocol = req.protocol
    const host = req.get("host")
    const url = `${protocol}://${host}/uploads/${req.file.filename}`

    console.log("[UPLOAD] Image uploaded successfully:", {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url,
    })

    res.json({
      success: true,
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })
  } catch (error: any) {
    console.error("[UPLOAD] Error uploading image:", error)
    res.status(500).json({ error: error.message || "Error al subir la imagen" })
  }
})

// POST /api/upload/video
// Upload video file and return public URL
router.post("/video", authenticateToken, requirePasswordChange, upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo" })
    }

    // Generate public URL
    const protocol = req.protocol
    const host = req.get("host")
    const url = `${protocol}://${host}/uploads/${req.file.filename}`

    console.log("[UPLOAD] Video uploaded successfully:", {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url,
    })

    res.json({
      success: true,
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })
  } catch (error: any) {
    console.error("[UPLOAD] Error uploading video:", error)
    res.status(500).json({ error: error.message || "Error al subir el video" })
  }
})

// GET /api/upload/test
// Test endpoint to verify upload directory exists
router.get("/test", authenticateToken, requirePasswordChange, async (req: any, res) => {
  try {
    const exists = fs.existsSync(uploadsDir)
    const files = exists ? fs.readdirSync(uploadsDir) : []

    res.json({
      uploadsDir,
      exists,
      fileCount: files.length,
      files: files.slice(0, 10), // Show first 10 files
    })
  } catch (error: any) {
    console.error("[UPLOAD] Error checking uploads directory:", error)
    res.status(500).json({ error: error.message })
  }
})

export default router
