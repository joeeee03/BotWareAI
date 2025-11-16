// [TAG: WebSocket]
// Socket.IO event handlers for real-time communication

import { Server, Socket } from 'socket.io'

export function setupSocketHandlers(io: Server) {
  console.log('[SOCKET-HANDLER] Setting up Socket.IO event handlers...')
  
  // Log total de conexiones activas cada 10 segundos
  setInterval(() => {
    const sockets = io.sockets.sockets
    console.log(`[SOCKET-HANDLER] 📊 Conexiones activas: ${sockets.size}`)
    sockets.forEach((socket) => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id)
      console.log(`[SOCKET-HANDLER]    Socket ${socket.id} en rooms: ${rooms.join(', ')}`)
    })
  }, 10000)

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId
    console.log(`[SOCKET-HANDLER] 🟢 User ${userId} connected with socket ID: ${socket.id}`)
    console.log(`[SOCKET-HANDLER] 📍 Socket address: ${socket.handshake.address}`)

    // Automatically join user to their personal room for global updates
    const userRoom = `user_${userId}`
    socket.join(userRoom)
    console.log(`[SOCKET-HANDLER] ✅ User ${userId} joined room: ${userRoom}`)
    console.log(`[SOCKET-HANDLER] 🎯 Este usuario recibirá eventos en: ${userRoom}`)

    // Handle joining a conversation room
    socket.on('join:conversation', (conversationId: string) => {
      const conversationRoom = `conversation_${conversationId}`
      socket.join(conversationRoom)
      console.log(`[SOCKET-HANDLER] 📥 User ${userId} joined conversation room: ${conversationRoom}`)
      
      // Emit confirmation back to client
      socket.emit('conversation:joined', { conversationId })
    })

    // Handle leaving a conversation room
    socket.on('leave:conversation', (conversationId: string) => {
      const conversationRoom = `conversation_${conversationId}`
      socket.leave(conversationRoom)
      console.log(`[SOCKET-HANDLER] 📤 User ${userId} left conversation room: ${conversationRoom}`)
      
      // Emit confirmation back to client
      socket.emit('conversation:left', { conversationId })
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET-HANDLER] 🔴 User ${userId} disconnected: ${reason}`)
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[SOCKET-HANDLER] ❌ Socket error for user ${userId}:`, error)
    })
  })

  console.log('[SOCKET-HANDLER] ✅ Socket.IO event handlers configured')
}
