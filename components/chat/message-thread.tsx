// [TAG: UI]
// [TAG: Mensajes]
// [TAG: WebSocket]
// Message thread component with real-time updates

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"
import { getSocket } from "@/lib/socket-client"
import { useToast } from "@/hooks/use-toast"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatWhatsAppText } from "@/lib/whatsapp-formatter"
import { formatMessageTime, getUserCountry } from "@/lib/timezone-utils"

interface MessageThreadProps {
  conversation: any
  onConversationUpdate: () => void
  onClose?: () => void
}

interface Message {
  id: number
  conversation_id: number
  sender: "user" | "bot"
  message: string
  created_at: string
  tempId?: string
  isPending?: boolean
}

export function MessageThread({ conversation, onConversationUpdate, onClose }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const userCountry = getUserCountry()

  const token = apiClient.getToken()

  // [TAG: WebSocket]
  // Get socket connection status without creating new socket instance
  const socket = apiClient.getToken() ? getSocket() : null
  const isConnected = socket?.connected || false

  // Join conversation room when conversation changes (LIKE WHATSAPP WEB)
  useEffect(() => {
    if (!socket || !conversation?.id) return

    const conversationId = conversation.id.toString()
    console.log("🚪 [MESSAGE-THREAD] Joining conversation room:", conversationId)
    
    // Join the conversation room
    socket.emit("join:conversation", conversationId)

    return () => {
      console.log("🚪 [MESSAGE-THREAD] Leaving conversation room:", conversationId)
      socket.emit("leave:conversation", conversationId)
    }
  }, [socket, conversation?.id])

  // Listen for new messages using useEffect instead of useSocket hook
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (newMessage: Message) => {
      console.log("📨 [MESSAGE-THREAD] New message received:", newMessage)
      console.log("📨 [MESSAGE-THREAD] Message text:", newMessage.message)
      console.log("📨 [MESSAGE-THREAD] Current conversation ID:", conversation?.id)
      
      // Only add message if it belongs to current conversation
      if (newMessage.conversation_id === conversation?.id) {
        console.log("✅ [MESSAGE-THREAD] Adding message to current conversation")
        console.log("💬 [MESSAGE-THREAD] Message content being added:", newMessage.message)
        setMessages((prev) => {
          // Check if message already exists by ID (real messages only, ignore temp IDs)
          // Real messages have positive IDs, temp messages have negative IDs
          const existsById = newMessage.id && newMessage.id > 0 && prev.some((m) => m.id === newMessage.id)
          const existsByTempId = newMessage.tempId && prev.some((m) => m.tempId === newMessage.tempId)
          
          if (existsById || existsByTempId) {
            console.log("⚠️ [MESSAGE-THREAD] Message already exists, skipping", { existsById, existsByTempId, messageId: newMessage.id })
            return prev
          }
          
          console.log("✨ [MESSAGE-THREAD] Appending new message with text:", newMessage.message)
          // Append new message at the end (bottom)
          const newMessages = [...prev, newMessage]
          
          // CRITICAL: Scroll AFTER React updates the DOM
          // Use multiple RAF (requestAnimationFrame) to wait for DOM update
          requestAnimationFrame(() => {
            console.log("📜 [SCROLL] RAF 1 - Waiting for DOM update")
            requestAnimationFrame(() => {
              console.log("📜 [SCROLL] RAF 2 - DOM should be updated now, scrolling...")
              scrollToBottom(true)
              // Extra attempts to ensure it works
              setTimeout(() => scrollToBottom(true), 0)
              setTimeout(() => scrollToBottom(true), 10)
              setTimeout(() => scrollToBottom(true), 50)
              setTimeout(() => scrollToBottom(true), 100)
            })
          })
          
          return newMessages
        })
      } else {
        console.log("⏭️ [MESSAGE-THREAD] Message not for current conversation")
      }
      
      // Always update conversation list for any new message
      onConversationUpdate()
    }

    const handleMessageSentAck = ({ tempId, message }: { tempId?: string; message: Message }) => {
      console.log("✅ [MESSAGE-THREAD] Message sent acknowledgment:", tempId, message)
      setMessages((prev) => {
        // Replace temporary message with real message from DB
        const hasTemp = prev.some(m => m.tempId === tempId)
        if (!hasTemp) {
          console.log("⚠️ [MESSAGE-THREAD] Temp message not found, adding real message")
          return [...prev, { ...message, isPending: false }]
        }
        return prev.map((m) => 
          m.tempId === tempId 
            ? { ...message, isPending: false }
            : m
        )
      })
    }

    socket.on("message:new", handleNewMessage)
    socket.on("message:sent:ack", handleMessageSentAck)

    return () => {
      socket.off("message:new", handleNewMessage)
      socket.off("message:sent:ack", handleMessageSentAck)
    }
  }, [socket, conversation?.id, onConversationUpdate])

  useEffect(() => {
    if (conversation?.id) {
      loadMessages()
    }
  }, [conversation?.id])

  // Scroll to bottom when messages change (ensures we're always at bottom)
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      console.log("📜 [MESSAGE-THREAD] Messages array changed (length:", messages.length, "), scrolling...")
      // Wait for DOM update with double RAF
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log("📜 [EFFECT] DOM updated, scrolling to bottom")
          scrollToBottom(true)
          setTimeout(() => scrollToBottom(true), 10)
          setTimeout(() => scrollToBottom(true), 50)
          setTimeout(() => scrollToBottom(true), 100)
        })
      })
    }
  }, [messages.length, isLoading])

  // Only reload messages when socket reconnects after being disconnected
  useEffect(() => {
    if (isConnected && conversation?.id) {
      // Only reload if we were previously disconnected
      // This prevents unnecessary reloads on initial connection
    }
  }, [isConnected, conversation?.id])

  // Close on Escape: when inside an active chat, pressing ESC should close it
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.()
      }
    }

    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const loadMessages = async (reset = true) => {
    setIsLoading(true)
    setCurrentOffset(0)
    
    console.log('[MESSAGE-THREAD] 🔄 Loading initial 50 messages for conversation:', conversation.id)
    
    try {
      const response = await apiClient.getMessages(conversation.id.toString(), 50, 0)
      console.log('[MESSAGE-THREAD] ✅ Loaded', response.messages.length, 'messages from API')
      
      if (response.messages.length > 0) {
        setMessages(response.messages)
        setCurrentOffset(50)
        setHasMoreMessages(response.messages.length === 50)
      } else {
        setMessages([])
        setCurrentOffset(0)
        setHasMoreMessages(false)
      }
      
      // Scroll after messages loaded
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom(true)
        })
      })
    } catch (error: any) {
      toast({
        title: "Error al cargar mensajes",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return
    
    setIsLoadingMore(true)
    console.log('[MESSAGE-THREAD] 🔄 Loading more messages from offset:', currentOffset)
    
    // Guardar posición actual antes de cargar
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
    const scrollHeightBefore = viewport?.scrollHeight || 0
    const scrollTopBefore = viewport?.scrollTop || 0
    
    try {
      const response = await apiClient.getMessages(
        conversation.id.toString(), 
        50, 
        currentOffset
      )
      console.log('[MESSAGE-THREAD] ✅ Loaded', response.messages.length, 'older messages')
      
      if (response.messages.length > 0) {
        setMessages((prev) => [...response.messages, ...prev])
        setCurrentOffset(prev => prev + response.messages.length)
        setHasMoreMessages(response.messages.length === 50)
        
        // Restaurar posición de scroll después de que se rendericen los mensajes
        requestAnimationFrame(() => {
          if (viewport) {
            const scrollHeightAfter = viewport.scrollHeight
            const scrollDiff = scrollHeightAfter - scrollHeightBefore
            viewport.scrollTop = scrollTopBefore + scrollDiff
            console.log('[MESSAGE-THREAD] 📍 Restored scroll position')
          }
        })
      } else {
        setHasMoreMessages(false)
      }
    } catch (error: any) {
      console.error('[MESSAGE-THREAD] Error loading more messages:', error)
      toast({
        title: "Error al cargar más mensajes",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Handle scroll to load more messages
  useEffect(() => {
    if (!scrollRef.current) return
    
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
    if (!viewport) return
    
    const handleScroll = () => {
      // Check if user scrolled to top (with 100px threshold)
      if (viewport.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
        console.log('[MESSAGE-THREAD] 📜 User scrolled to top, loading more messages')
        loadMoreMessages()
      }
    }
    
    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMore, currentOffset])

  const scrollToBottom = (instant = false) => {
    if (!scrollRef.current) {
      console.log("⚠️ [SCROLL] scrollRef.current is null!")
      return
    }
    
    // ScrollArea de shadcn/ui tiene un viewport interno
    // Buscar el div con data-radix-scroll-area-viewport
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
    const scrollContainer = viewport || scrollRef.current
    
    // Calcular el scroll máximo real
    const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight
    
    console.log("📜 [SCROLL] Scrolling to bottom:", {
      scrollHeight: scrollContainer.scrollHeight,
      clientHeight: scrollContainer.clientHeight,
      maxScroll,
      currentScroll: scrollContainer.scrollTop
    })
    
    // FORZAR scroll al fondo (como WhatsApp)
    scrollContainer.scrollTop = maxScroll + 100 // +100 para asegurar que llegue al fondo
    
    // Intentar también con scrollTo
    scrollContainer.scrollTo({
      top: maxScroll + 100,
      behavior: 'auto' // Siempre instantáneo
    })
    
    console.log("📜 [SCROLL] After scroll:", scrollContainer.scrollTop)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputMessage.trim() || isSending) return

    const messageText = inputMessage.trim()
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Optimistic UI update
    const tempMessage: Message = {
      id: -Date.now(), // Use negative timestamp as temporary ID to avoid conflicts
      conversation_id: conversation.id,
      // When the client (bot) sends a message to the customer, mark it as 'bot'
      sender: "bot",
      message: messageText,
      created_at: new Date().toISOString(),
      tempId,
      isPending: true,
    }

    setMessages((prev) => [...prev, tempMessage])
    setInputMessage("")
    setIsSending(true)
    scrollToBottom()

    try {
      await apiClient.sendMessage(conversation.id.toString(), messageText, tempId)
      onConversationUpdate()
    } catch (error: any) {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      })
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId))
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center dark:bg-slate-900 bg-white">
        <div className="flex flex-col items-center gap-4">
          {/* Animated loader */}
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            {/* Inner pulsing circle */}
            <div className="absolute inset-0 w-16 h-16 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-pulse"></div>
            </div>
            {/* Center dot */}
            <div className="absolute inset-0 w-16 h-16 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          
          {/* Loading text with animation */}
          <div className="flex items-center gap-1">
            <span className="dark:text-slate-300 text-slate-700 font-medium animate-pulse">
              Preparando conversación
            </span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-slate-900 bg-white">
      {/* Header */}
      <div className="p-4 border-b dark:border-slate-700 border-blue-200 flex items-center justify-between dark:bg-slate-800/50 bg-white/90">
        <div className="flex items-center gap-3">
          {/* Botón volver para móviles */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg dark:bg-slate-700/50 bg-blue-100/50 dark:text-slate-300 text-slate-600 hover:dark:bg-slate-600/50 hover:bg-blue-200/50 transition-colors"
            aria-label="Volver a conversaciones"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div>
            <h2 className="font-semibold dark:text-slate-100 text-slate-800 text-sm sm:text-base">
              {conversation.customer_name || conversation.customer_phone}
            </h2>
            <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600">{conversation.customer_phone}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="text-xs dark:text-slate-400 text-slate-500 animate-pulse">
              Cargando...
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full dark:bg-slate-700/50 bg-blue-100/50">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-400" : "bg-red-400")} />
            <span className="text-xs dark:text-slate-300 text-slate-600 font-medium">
              {isConnected ? "En línea" : "Desconectado"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 overflow-y-auto p-4 dark:bg-slate-900 bg-white" 
        ref={scrollRef}
      >
        <div className="space-y-2">
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 dark:text-slate-400 text-slate-600">
                <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm">Cargando mensajes anteriores...</span>
              </div>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="dark:text-slate-400 text-slate-600">Sin mensajes aún — inicia la conversación</div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.tempId || message.id}
                // Bot messages should appear on the right (blue). User messages should be on the left (slate).
                className={cn("flex", message.sender === "bot" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[70%] rounded-lg px-3 sm:px-4 py-2 shadow-sm relative",
                    // Professional styling: bot -> blue, user -> slate/white
                    message.sender === "bot" 
                      ? "bg-blue-600 text-white" 
                      : "dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 bg-blue-50 text-slate-800 border border-blue-200",
                    message.isPending && "opacity-60",
                  )}
                >
                  <div className="text-sm sm:text-base break-words pr-12 sm:pr-14">
                    {formatWhatsAppText(message.message)}
                  </div>
                  <p className={cn("text-xs mt-1 absolute bottom-1.5 right-2 sm:bottom-2 sm:right-3 whitespace-nowrap", message.sender === "bot" ? "text-blue-100" : "dark:text-slate-400 text-slate-600")}>
                    {formatMessageTime(message.created_at, userCountry)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t dark:border-slate-700 border-blue-200 dark:bg-slate-800/50 bg-white/90">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isSending}
            className="flex-1 dark:bg-slate-700/50 bg-blue-50/50 dark:border-slate-600 border-blue-200 dark:text-slate-100 text-slate-800 dark:placeholder:text-slate-400 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button 
            type="submit" 
            disabled={isSending || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
