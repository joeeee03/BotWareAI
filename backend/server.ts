// [TAG: WebSocket]
// Main server file with Express and Socket.IO setup

import 'dotenv/config'
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import authRoutes from "./routes/auth.js"
import conversationsRoutes from "./routes/conversations.js"
import messagesRoutes from "./routes/messages.js"
import webhookRoutes from "./routes/webhook.js"
import botsRoutes from "./routes/bots.js"
import jwt from "jsonwebtoken"
import { startRealtimeListener } from "./realtime-listener.js"

const app = express()
const httpServer = createServer(app)

// [TAG: WebSocket]
// Socket.IO configuration with CORS and authentication
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  
  if (!token) {
    console.log("[v0] Socket connection rejected: No token provided")
    return next(new Error("Authentication error: No token provided"))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    socket.data.userId = decoded.user_id
    socket.data.user = decoded
    console.log("[v0] Socket authenticated for user:", decoded.user_id)
    next()
  } catch (err) {
    console.log("[v0] Socket connection rejected: Invalid token")
    next(new Error("Authentication error: Invalid token"))
  }
})

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/api/auth", authRoutes)
app.use("/api/conversations", conversationsRoutes)
app.use("/api/messages", messagesRoutes)
app.use("/api/webhook", webhookRoutes)
app.use("/api/bots", botsRoutes)

// [TAG: WebSocket]
// Socket.IO connection handler
io.on("connection", (socket) => {
  const userId = socket.data.userId
  console.log("[v0] Client connected:", socket.id, "User ID:", userId)

  // Automatically join user room for global updates
  socket.join(`user_${userId}`)
  console.log("[v0] Client auto-joined user room:", userId)
  socket.emit("user:joined", { userId })

  // Join user room for global updates (manual)
  socket.on("join:user", (requestedUserId: string) => {
    // Only allow joining own user room
    if (requestedUserId === userId.toString()) {
      socket.join(`user_${requestedUserId}`)
      console.log("[v0] Client manually joined user room:", requestedUserId)
      socket.emit("user:joined", { userId: requestedUserId })
    } else {
      console.log("[v0] Unauthorized user room join attempt:", requestedUserId, "by user:", userId)
    }
  })

  // Leave user room
  socket.on("leave:user", (requestedUserId: string) => {
    if (requestedUserId === userId.toString()) {
      socket.leave(`user_${requestedUserId}`)
      console.log("[v0] Client left user room:", requestedUserId)
      socket.emit("user:left", { userId: requestedUserId })
    }
  })

  // Join conversation room
  socket.on("join:conversation", (conversationId: string) => {
    const roomName = `conversation_${conversationId}`
    socket.join(roomName)
    
    // Log room members
    const room = io.sockets.adapter.rooms.get(roomName)
    const memberCount = room ? room.size : 0
    
    console.log("🚪 [SOCKET] Client joined conversation:", conversationId)
    console.log("👥 [SOCKET] Room members count:", memberCount)
    socket.emit("conversation:joined", { conversationId })
  })

  // Leave conversation room
  socket.on("leave:conversation", (conversationId: string) => {
    const roomName = `conversation_${conversationId}`
    socket.leave(roomName)
    
    // Log room members
    const room = io.sockets.adapter.rooms.get(roomName)
    const memberCount = room ? room.size : 0
    
    console.log("🚪 [SOCKET] Client left conversation:", conversationId)
    console.log("👥 [SOCKET] Room members count:", memberCount)
    socket.emit("conversation:left", { conversationId })
  })

  socket.on("disconnect", () => {
    console.log("[v0] Client disconnected:", socket.id)
  })
})

// Export io for use in routes
export { io }

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`)
  
  // [TAG: Realtime]
  // Iniciar listener de PostgreSQL para detectar inserts en messages
  console.log('[v0] Starting PostgreSQL realtime listener...')
  startRealtimeListener(io)
})

export default app
