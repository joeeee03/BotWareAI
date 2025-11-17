// Socket.IO client - SIMPLE version
import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null
let currentToken: string | null = null

export const initializeSocket = (token: string): Socket => {
  if (socket && socket.connected && currentToken === token) {
    console.log("🔄 [SOCKET] Reusing connection")
    return socket
  }

  if (socket && currentToken !== token) {
    console.log("🔄 [SOCKET] Token changed, reconnecting")
    socket.disconnect()
    socket = null
  }

  currentToken = token

  // Conectar directamente al backend
  const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
  
  console.log('🔌 [SOCKET] Connecting to:', socketUrl)
  
  socket = io(socketUrl, {
    path: '/socket.io',
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  })

  socket.on("connect", () => {
    console.log("🟢 [SOCKET] Connected:", socket?.id)
  })

  socket.on("disconnect", (reason) => {
    console.log("🔴 [SOCKET] Disconnected:", reason)
  })

  socket.on("connect_error", (error) => {
    console.error("❌ [SOCKET] Error:", error.message)
  })

  socket.onAny((eventName, ...args) => {
    console.log(`📨 [SOCKET] ${eventName}:`, JSON.stringify(args).substring(0, 150))
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
