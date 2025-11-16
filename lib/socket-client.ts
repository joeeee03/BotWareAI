// [TAG: WebSocket]
// Socket.IO client configuration for real-time messaging

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

let currentToken: string | null = null

export const initializeSocket = (token: string): Socket => {
  // Only reconnect if token changed or socket is not connected
  if (socket && socket.connected && currentToken === token) {
    console.log("🔄 [SOCKET] Reusing existing connection")
    return socket
  }

  // Disconnect only if token changed
  if (socket && currentToken !== token) {
    console.log("🔄 [SOCKET] Token changed, reconnecting...")
    socket.disconnect()
    socket = null
  }

  currentToken = token

  // En producción (Railway), usar rutas relativas para que Next.js rewrite al backend
  // En desarrollo local, usar http://localhost:3001
  const socketUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin // Producción: usar el mismo origen (Next.js hace rewrite)
    : (process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_IO_URL || "http://localhost:3001")

  console.log('🔌 [SOCKET] Connecting to:', socketUrl)

  socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 3,
    timeout: 20000,
  })

  socket.on("connect", () => {
    console.log("🟢 [SOCKET] Connected:", socket?.id)
  })

  socket.on("disconnect", (reason) => {
    console.log("🔴 [SOCKET] Disconnected:", reason)
  })

  socket.on("connect_error", (error) => {
    console.error("❌ [SOCKET] Connection error:", error)
  })

  // Add debugging for all events
  socket.on("message:new", (message) => {
    console.log("📨 [SOCKET] New message received:", message)
  })

  socket.on("message:sent:ack", (data) => {
    console.log("✅ [SOCKET] Message sent ACK:", data)
  })

  socket.on("conversation:updated", (data) => {
    console.log("🔄 [SOCKET] Conversation updated:", data)
  })

  socket.on("conversation:created", (data) => {
    console.log("🆕 [SOCKET] New conversation created:", data)
  })

  socket.on("user:joined", (data) => {
    console.log("👤 [SOCKET] User joined room:", data)
  })

  return socket
}

export const getSocket = (): Socket | null => {
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// [TAG: WebSocket]
// Join a conversation room
export const joinConversation = (conversationId: string) => {
  if (socket && socket.connected) {
    socket.emit("join:conversation", conversationId)
    console.log("[v0] Joined conversation room:", conversationId)
  } else {
    console.log("[v0] Cannot join conversation - socket not connected")
  }
}

// [TAG: WebSocket]
// Leave a conversation room
export const leaveConversation = (conversationId: string) => {
  if (socket && socket.connected) {
    socket.emit("leave:conversation", conversationId)
    console.log("[v0] Left conversation:", conversationId)
  }
}
