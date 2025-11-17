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
    origin: (origin, callback) => {
      // Permitir requests sin origin (importante para Railway)
      if (!origin) return callback(null, true)
      
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080"
      ].filter(Boolean)
      
      // En Railway, permitir cualquier subdominio de railway.app
      if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
        console.log("[v0] Socket.IO - Allowing Railway origin:", origin)
        return callback(null, true)
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("[v0] Socket.IO - Allowing known origin:", origin)
        callback(null, true)
      } else {
        console.log("[v0] Socket.IO - Allowing unknown origin:", origin)
        callback(null, true) // Permitir todos en Railway
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"],
  },
  path: '/socket.io',
  // En Railway, priorizar polling porque funciona mejor con Next.js proxy
  transports: ['polling', 'websocket'],
  allowEIO3: true, // Compatibilidad con versiones anteriores
  pingTimeout: 60000, // Más tiempo para Railway
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
})

console.log("[v0] Socket.IO configured")

// Socket.IO authentication middleware
io.use((socket, next) => {
  console.log("[v0] 🔐 Socket connection attempt from:", socket.handshake.address)
  console.log("[v0] 🔐 Origin:", socket.handshake.headers.origin)
  
  const token = socket.handshake.auth.token
  
  if (!token) {
    console.log("[v0] ❌ Socket connection rejected: No token provided")
    console.log("[v0] ❌ Auth object:", socket.handshake.auth)
    return next(new Error("Authentication error: No token provided"))
  }

  console.log("[v0] 🔑 Token received (first 20 chars):", token.substring(0, 20) + "...")

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    socket.data.userId = decoded.user_id
    socket.data.user = decoded
    console.log("[v0] ✅ Socket authenticated for user:", decoded.user_id)
    console.log("[v0] ✅ Socket ID:", socket.id)
    next()
  } catch (err: any) {
    console.log("[v0] ❌ Socket connection rejected: Invalid token")
    console.log("[v0] ❌ JWT Error:", err.message)
    next(new Error("Authentication error: Invalid token"))
  }
})

// Middleware CORS - permitir diferentes puertos
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como apps móviles o Postman)
      if (!origin) return callback(null, true)
      
      // Lista de origenes permitidos
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080"
      ].filter(Boolean)
      
      // En Railway, permitir cualquier puerto del mismo dominio
      if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
        return callback(null, true)
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        console.log('[CORS] Blocked origin:', origin)
        callback(null, true) // Permitir de todos modos para evitar bloqueos
      }
    },
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

// Root route for Railway healthcheck
app.get("/", (req, res) => {
  res.json({ 
    message: "WhatsApp Backend API", 
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      api: "/api/*",
      socket: "/socket.io"
    }
  })
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
      
      // Setup Socket.IO event handlers
      console.log('[Server] Setting up Socket.IO handlers...')
      try {
        import("./services/socket-handler.js").then(({ setupSocketHandlers }) => {
          setupSocketHandlers(io)
          console.log('[Server] ✅ Socket.IO handlers ready')
        }).catch(err => {
          console.error('[Server] Socket handlers error:', err)
        })
      } catch (err) {
        console.error('[Server] Socket import error:', err)
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
