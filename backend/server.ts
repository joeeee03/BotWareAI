// [TAG: WebSocket]
// Main server file with Express and Socket.IO setup

import 'dotenv/config'
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import jwt from "jsonwebtoken"

console.log("[v0] Starting server initialization...")

const app = express()
const httpServer = createServer(app)

console.log("[v0] Express and HTTP server created")

// [TAG: WebSocket]
// Socket.IO configuration with CORS and authentication
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

console.log("[v0] Socket.IO configured")

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

console.log("[v0] Middleware configured")

// Health check - this MUST work before routes load
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

console.log("[v0] Health check endpoint registered")

// Main async initialization function
async function initializeServer() {
  // Import and register routes - wrapped in try-catch to prevent blocking
  try {
    const { default: authRoutes } = await import("./routes/auth.js")
    const { default: conversationsRoutes } = await import("./routes/conversations.js")
    const { default: messagesRoutes } = await import("./routes/messages.js")
    const { default: webhookRoutes } = await import("./routes/webhook.js")
    const { default: botsRoutes } = await import("./routes/bots.js")
    const { default: debugRoutes } = await import("./routes/debug.js")
    
    app.use("/api/auth", authRoutes)
    app.use("/api/conversations", conversationsRoutes)
    app.use("/api/messages", messagesRoutes)
    app.use("/api/webhook", webhookRoutes)
    app.use("/api/bots", botsRoutes)
    app.use("/api/debug", debugRoutes)
    
    console.log("[v0] Routes registered successfully")
  } catch (err) {
    console.error("[v0] Error registering routes:", err)
    // Continue anyway - healthcheck still works
  }

  const PORT = parseInt(process.env.PORT || '3001', 10)

  console.log(`[v0] Attempting to listen on port ${PORT}...`)

  return new Promise((resolve) => {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[v0] ✅ Server running on port ${PORT}`)
      console.log(`[v0] Listening on 0.0.0.0:${PORT}`)
      
      // [TAG: WebSocket]
      // Setup Socket.IO event handlers
      console.log('[v0] Setting up Socket.IO event handlers...')
      try {
        import("./services/socket-handler.js").then(({ setupSocketHandlers }) => {
          setupSocketHandlers(io)
          console.log('[v0] ✅ Socket.IO event handlers configured')
        }).catch(err => {
          console.error('[v0] Error setting up socket handlers:', err)
        })
      } catch (err) {
        console.error('[v0] Error importing socket handlers:', err)
      }
      
      // [TAG: Realtime]
      // Sistema PROFESIONAL: PostgreSQL LISTEN/NOTIFY (detección INSTANTÁNEA)
      console.log('[v0] Configurando sistema de tiempo real profesional...')
      try {
        // Paso 1: Crear triggers automáticamente (si no existen)
        import("./setup-triggers-auto.js").then(async ({ setupTriggersIfNeeded }) => {
          const triggersOk = await setupTriggersIfNeeded()
          
          if (triggersOk) {
            console.log('[v0] ✅ Triggers configurados')
            
            // Paso 2: Iniciar LISTEN/NOTIFY (detección INSTANTÁNEA, sin polling)
            console.log('[v0] Iniciando PostgreSQL LISTEN/NOTIFY...')
            import("./realtime-listener.js").then(({ startRealtimeListener }) => {
              startRealtimeListener(io)
              console.log('[v0] ✅ Sistema LISTEN/NOTIFY activo')
              console.log('[v0] 🚀 PostgreSQL notificará INSTANTÁNEAMENTE cuando se inserte un mensaje')
              console.log('[v0] 💡 NO hay polling - es 100% tiempo real profesional')
            }).catch(err => {
              console.error('[v0] Error iniciando realtime listener:', err)
            })
          } else {
            console.log('[v0] ⚠️  Triggers no disponibles - sistema puede no funcionar')
          }
        }).catch(err => {
          console.error('[v0] Error configurando triggers:', err)
        })
      } catch (err) {
        console.error('[v0] Error en setup de tiempo real:', err)
      }
      
      resolve(true)
    })

    httpServer.on('error', (err: any) => {
      console.error('[v0] 🔴 Server error:', err.code, err.message)
      if (err.code === 'EADDRINUSE') {
        console.error(`[v0] Port ${PORT} is already in use`)
      }
    })
  })
}

// Call initialization
initializeServer().catch(err => {
  console.error('[v0] Fatal error during server initialization:', err)
  process.exit(1)
})
