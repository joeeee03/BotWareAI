// [TAG: WebSocket]
// React hook for Socket.IO messaging

"use client"

import { useEffect, useCallback } from "react"
import { initializeSocket, getSocket, joinConversation, leaveConversation } from "@/lib/socket-client"

interface Message {
  id: number
  conversation_id: number
  sender: "user" | "bot"
  message: string
  created_at: string
}

interface UseSocketProps {
  token: string | null
  conversationId?: string
  userId?: string
  onNewMessage?: (message: Message) => void
  onMessageSentAck?: (data: { tempId?: string; message: Message }) => void
  onConversationUpdate?: (data?: any) => void
  onConversationUpdated?: (data: any) => void
  onConversationCreated?: (conversation: any) => void
}

export function useSocket({ token, conversationId, userId, onNewMessage, onMessageSentAck, onConversationUpdate, onConversationUpdated, onConversationCreated }: UseSocketProps) {
  useEffect(() => {
    if (!token) {
      console.log("⚠️ [SOCKET] No token provided, skipping socket initialization")
      return
    }

    console.log("🔌 [SOCKET] Initializing socket with token...")
    // Initialize socket connection
    const socket = initializeSocket(token)

    // Set up event listeners
    if (onNewMessage) {
      socket.on("message:new", onNewMessage)
    }

    if (onMessageSentAck) {
      socket.on("message:sent:ack", onMessageSentAck)
    }

    if (onConversationUpdate) {
      socket.on("message:new", onConversationUpdate)
      socket.on("message:sent:ack", onConversationUpdate)
    }

    if (onConversationUpdated) {
      socket.on("conversation:updated", onConversationUpdated)
    }

    if (onConversationCreated) {
      socket.on("conversation:new", onConversationCreated)
    }

    // Add debugging for connection events
    socket.on("conversation:joined", (data) => {
      console.log("[v0] Successfully joined conversation room:", data)
    })

    socket.on("conversation:left", (data) => {
      console.log("[v0] Successfully left conversation room:", data)
    })

    return () => {
      // Clean up listeners
      if (onNewMessage) {
        socket.off("message:new", onNewMessage)
      }
      if (onMessageSentAck) {
        socket.off("message:sent:ack", onMessageSentAck)
      }
      if (onConversationUpdate) {
        socket.off("message:new", onConversationUpdate)
        socket.off("message:sent:ack", onConversationUpdate)
      }
      if (onConversationUpdated) {
        socket.off("conversation:updated", onConversationUpdated)
      }
      if (onConversationCreated) {
        socket.off("conversation:new", onConversationCreated)
      }
      
      // Clean up debugging listeners
      socket.off("conversation:joined")
      socket.off("conversation:left")
    }
  }, [token, onNewMessage, onMessageSentAck, onConversationUpdate, onConversationUpdated, onConversationCreated])

  // Join conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      console.log("[DEBUG] Joining conversation:", conversationId)
      joinConversation(conversationId)

      return () => {
        console.log("[DEBUG] Leaving conversation:", conversationId)
        leaveConversation(conversationId)
      }
    }
  }, [conversationId])

  // Join user room when userId changes (now handled automatically by server)
  useEffect(() => {
    if (userId) {
      const socket = getSocket()
      if (socket && socket.connected) {
        console.log("[DEBUG] User room should be auto-joined:", userId)
        // Server now auto-joins user to their room on connection
      }
    }
  }, [userId])

  const sendMessage = useCallback(
    (message: string, tempId?: string) => {
      const socket = getSocket()
      if (!socket || !conversationId) return

      // Socket.IO is used for real-time updates
      // Actual sending happens via API call
      return { tempId, conversationId, message }
    },
    [conversationId],
  )

  return {
    sendMessage,
    isConnected: getSocket()?.connected || false,
  }
}
