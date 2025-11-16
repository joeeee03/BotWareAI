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

  // IMPORTANTE: En Railway, Next.js hace REWRITE de /socket.io/* al backend interno
  // Railway solo expone UN puerto, así que Socket.IO debe usar el mismo origen
  // Next.js reescribe /socket.io/* a http://localhost:3001/socket.io/*
  
  let socketUrl: string
  
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    
    if (isProduction) {
      // RAILWAY: Usar el mismo origen (Next.js hará el rewrite internamente)
      socketUrl = window.location.origin
      console.log('🔌 [SOCKET] RAILWAY MODE - Using Next.js rewrite:', socketUrl)
    } else {
      // LOCAL: Conectar directamente a localhost:3001
      socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
      console.log('🔌 [SOCKET] LOCAL MODE - Direct connection:', socketUrl)
    }
  } else {
    socketUrl = "http://localhost:3001"
  }

  console.log('🔌 [SOCKET] Final socket URL:', socketUrl)
  console.log('🔌 [SOCKET] Path: /socket.io (Next.js will rewrite this)')
  console.log('🔌 [SOCKET] Token length:', token.length)

  socket = io(socketUrl, {
    path: '/socket.io', // Explicit path for Socket.IO (Next.js will rewrite this)
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10, // More attempts for better reliability
    timeout: 20000,
    forceNew: false, // Reuse existing connections
    autoConnect: true,
  })

  socket.on("connect", () => {
    console.log("🟢 [SOCKET] Connected:", socket?.id)
    console.log("🟢 [SOCKET] Transport:", socket?.io.engine.transport.name)
  })

  socket.on("disconnect", (reason) => {
    console.log("🔴 [SOCKET] Disconnected:", reason)
    if (reason === "io server disconnect") {
      console.log("🔴 [SOCKET] Server desconectó - reconectando...")
      socket?.connect()
    }
  })

  socket.on("connect_error", (error) => {
    console.error("❌ [SOCKET] Connection error:", error.message)
  })

  // Log TODOS los eventos recibidos (incluye message:new, conversation:updated, etc.)
  socket.onAny((eventName, ...args) => {
    console.log(`📨 [SOCKET] Event received: ${eventName}`, JSON.stringify(args).substring(0, 200))
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
