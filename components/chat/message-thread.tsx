// [TAG: UI]
// [TAG: Mensajes]
// [TAG: WebSocket]
// Message thread component with real-time updates

"use client"

import type React from "react"
import { Fragment } from "react"

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
import { formatMessageTime, getUserCountry, formatDateSeparator, isSameDayInTimezone } from "@/lib/timezone-utils"

interface MessageThreadProps {
  conversation: any
  onConversationUpdate: () => void
  onUpdateSender?: (conversationId: number, sender: string, lastMessage: string) => void
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

export function MessageThread({ conversation, onConversationUpdate, onUpdateSender, onClose }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [isScrollBlocked, setIsScrollBlocked] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousMessagesLengthRef = useRef(0)
  const newestMessageIdRef = useRef<number | null>(null)
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
          // Check if message already exists by ID or if there's a pending message for it
          const existsById = newMessage.id && newMessage.id > 0 && prev.some((m) => m.id === newMessage.id)
          const existsByTempId = newMessage.tempId && prev.some((m) => m.tempId === newMessage.tempId)
          // NUEVO: También verificar si hay un mensaje pendiente con el mismo contenido
          const hasPendingWithSameContent = prev.some((m) => 
            m.isPending && 
            m.message === newMessage.message && 
            m.sender === newMessage.sender &&
            // Solo si el mensaje es reciente (menos de 10 segundos)
            Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
          )
          
          if (existsById || existsByTempId || hasPendingWithSameContent) {
            console.log("⚠️ [MESSAGE-THREAD] Message already exists or is pending, skipping", { 
              existsById, 
              existsByTempId, 
              hasPendingWithSameContent,
              messageId: newMessage.id 
            })
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
        const tempIndex = prev.findIndex(m => m.tempId === tempId)
        
        if (tempIndex === -1) {
          console.log("⚠️ [MESSAGE-THREAD] Temp message not found")
          // Verificar si el mensaje real ya existe
          const realExists = prev.some(m => m.id === message.id)
          if (realExists) {
            console.log("⚠️ [MESSAGE-THREAD] Real message already exists, ignoring ack")
            return prev
          }
          console.log("➕ [MESSAGE-THREAD] Adding real message from ack")
          return [...prev, { ...message, isPending: false }]
        }
        
        console.log("🔄 [MESSAGE-THREAD] Replacing temp message with real message")
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

  // Scroll to bottom ONLY when new messages arrive (not when loading old ones)
  // We detect new messages by checking if the NEWEST (last) message ID changed
  useEffect(() => {
    // Skip if loading initial messages
    if (isLoading) {
      console.log("📜 [MESSAGE-THREAD] Skipping auto-scroll - initial loading")
      return
    }
    
    // CRITICAL: Skip if currently loading more messages
    if (isLoadingMore) {
      console.log("📜 [MESSAGE-THREAD] Skipping auto-scroll - loading more messages")
      return
    }
    
    // Skip if no messages
    if (messages.length === 0) {
      return
    }
    
    // Get the NEWEST (last) message in the array
    const currentNewestMessageId = messages[messages.length - 1]?.id
    const previousLength = previousMessagesLengthRef.current
    const previousNewestId = newestMessageIdRef.current
    
    console.log("📜 [MESSAGE-THREAD] Auto-scroll check:", {
      currentNewestMessageId,
      previousNewestId,
      currentLength: messages.length,
      previousLength,
      isLoadingMore
    })
    
    // Update refs for next time
    previousMessagesLengthRef.current = messages.length
    newestMessageIdRef.current = currentNewestMessageId
    
    // If this is the first render with messages, scroll to bottom
    if (previousLength === 0 && messages.length > 0) {
      console.log("📜 [MESSAGE-THREAD] First messages loaded, scrolling to bottom")
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom(true)
          setTimeout(() => scrollToBottom(true), 10)
          setTimeout(() => scrollToBottom(true), 50)
          setTimeout(() => scrollToBottom(true), 100)
        })
      })
      return
    }
    
    // If newest message ID DIDN'T change but length increased, we loaded old messages
    // In this case, DON'T scroll to bottom
    if (previousNewestId !== null && currentNewestMessageId === previousNewestId && messages.length > previousLength) {
      console.log("📜 [MESSAGE-THREAD] ❌ Old messages loaded (newest ID stayed", currentNewestMessageId, "but length increased) - NOT scrolling")
      return
    }
    
    // If newest message ID changed, a new message was added at the end
    if (previousNewestId !== null && currentNewestMessageId !== previousNewestId) {
      console.log("📜 [MESSAGE-THREAD] ✅ New message detected (newest ID changed from", previousNewestId, "to", currentNewestMessageId, ") - scrolling to bottom")
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log("📜 [EFFECT] DOM updated, scrolling to bottom")
          scrollToBottom(true)
          setTimeout(() => scrollToBottom(true), 10)
          setTimeout(() => scrollToBottom(true), 50)
          setTimeout(() => scrollToBottom(true), 100)
        })
      })
    } else {
      console.log("📜 [MESSAGE-THREAD] No new messages detected, not scrolling")
    }
  }, [messages, isLoading, isLoadingMore])

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
        
        // Actualizar last_message_sender en la lista de conversaciones
        const lastMessage = response.messages[response.messages.length - 1]
        if (lastMessage && onUpdateSender) {
          console.log('[MESSAGE-THREAD] Updating conversation sender:', lastMessage.sender)
          onUpdateSender(conversation.id, lastMessage.sender, lastMessage.message)
        }
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
    if (isLoadingMore || !hasMoreMessages || isScrollBlocked) return
    
    setIsLoadingMore(true)
    setIsScrollBlocked(true) // Bloquear scroll inmediatamente
    console.log('[MESSAGE-THREAD] 🔄 Loading more messages from offset:', currentOffset)
    console.log('[MESSAGE-THREAD] 🔒 Scroll BLOCKED for 1 second')
    
    // Guardar posición actual antes de cargar
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
    if (!viewport) {
      setIsLoadingMore(false)
      setIsScrollBlocked(false)
      return
    }
    
    const scrollHeightBefore = viewport.scrollHeight
    const scrollTopBefore = viewport.scrollTop
    
    console.log('[MESSAGE-THREAD] 📍 Before load:', {
      scrollHeightBefore,
      scrollTopBefore
    })
    
    try {
      const response = await apiClient.getMessages(
        conversation.id.toString(), 
        50, 
        currentOffset
      )
      console.log('[MESSAGE-THREAD] ✅ Loaded', response.messages.length, 'older messages')
      console.log('[MESSAGE-THREAD] 📊 First message ID:', response.messages[0]?.id, 'Last message ID:', response.messages[response.messages.length - 1]?.id)
      console.log('[MESSAGE-THREAD] 📊 Current messages array - First ID:', messages[0]?.id, 'Last ID:', messages[messages.length - 1]?.id)
      
      if (response.messages.length > 0) {
        // Store the first visible message ID to restore position
        const firstVisibleMessage = messages[0]
        
        setMessages((prev) => [...response.messages, ...prev])
        setCurrentOffset(prev => prev + response.messages.length)
        setHasMoreMessages(response.messages.length === 50)
        
        // Wait for DOM update with a longer delay to ensure React has rendered
        setTimeout(() => {
          const scrollHeightAfter = viewport.scrollHeight
          const heightDifference = scrollHeightAfter - scrollHeightBefore
          const newScrollTop = scrollTopBefore + heightDifference
          
          console.log('[MESSAGE-THREAD] 📍 After load:', {
            scrollHeightBefore,
            scrollHeightAfter,
            heightDifference,
            scrollTopBefore,
            newScrollTop
          })
          
          // Set the new scroll position to maintain user's view
          viewport.scrollTop = newScrollTop
          
          console.log('[MESSAGE-THREAD] 📍 Scroll restored to:', viewport.scrollTop)
          
          // Desbloquear scroll después de 1 segundo
          setTimeout(() => {
            setIsScrollBlocked(false)
            console.log('[MESSAGE-THREAD] 🔓 Scroll UNLOCKED')
          }, 1000)
        }, 100)
      } else {
        setHasMoreMessages(false)
        setIsScrollBlocked(false) // Desbloquear si no hay más mensajes
      }
    } catch (error: any) {
      console.error('[MESSAGE-THREAD] Error loading more messages:', error)
      toast({
        title: "Error al cargar más mensajes",
        description: error.message,
        variant: "destructive",
      })
      setIsScrollBlocked(false) // Desbloquear en caso de error
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
      // Bloquear si está cargando o si scroll está bloqueado
      if (isScrollBlocked) {
        console.log('[MESSAGE-THREAD] 🚫 Scroll blocked, ignoring scroll event')
        return
      }
      
      // Check if user scrolled to top (with 100px threshold)
      if (viewport.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
        console.log('[MESSAGE-THREAD] 📜 User scrolled to top, loading more messages')
        loadMoreMessages()
      }
    }
    
    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMore, currentOffset, isScrollBlocked])

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
      <div className="p-3 sm:p-4 border-b dark:border-slate-700 border-blue-200 flex items-center justify-between dark:bg-slate-800/50 bg-white/90 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Botón volver para móviles */}
          <button
            onClick={onClose}
            className="md:hidden p-2.5 rounded-lg dark:bg-slate-700/50 bg-blue-100/50 dark:text-slate-300 text-slate-600 hover:dark:bg-slate-600/50 hover:bg-blue-200/50 transition-colors flex-shrink-0 active:scale-95"
            aria-label="Volver a conversaciones"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold dark:text-slate-100 text-slate-800 text-base sm:text-lg truncate">
              {conversation.customer_name || conversation.customer_phone}
            </h2>
            <p className="text-sm dark:text-slate-400 text-slate-600 truncate">{conversation.customer_phone}</p>
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
            messages.map((message, index) => {
              // Determinar si debemos mostrar el separador de fecha
              const showDateSeparator = index === 0 || !isSameDayInTimezone(
                messages[index - 1].created_at,
                message.created_at,
                userCountry
              )
              
              return (
                <Fragment key={message.tempId || message.id}>
                  {/* Separador de fecha estilo WhatsApp */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-3 sm:my-4">
                      <div className="px-3 py-1.5 rounded-lg dark:bg-slate-700/80 bg-slate-200/90 backdrop-blur-sm shadow-sm">
                        <span className="text-xs sm:text-sm font-medium dark:text-slate-200 text-slate-700">
                          {formatDateSeparator(message.created_at, userCountry)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Mensaje */}
                  <div
                    className={cn("flex mb-2 px-2 sm:px-0", message.sender === "bot" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[75%] rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm relative transition-all duration-300",
                        // Professional styling: bot -> blue, user -> slate/white
                        message.sender === "bot" 
                          ? message.isPending
                            ? "bg-blue-700/70 text-white/90" // Más oscuro cuando está pendiente
                            : "bg-blue-600 text-white"
                          : "dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 bg-blue-50 text-slate-800 border border-blue-200",
                        message.isPending && "opacity-80",
                      )}
                    >
                      <div className="text-[15px] sm:text-base break-words pr-14 sm:pr-16 leading-relaxed">
                        {formatWhatsAppText(message.message)}
                      </div>
                      <p className={cn("text-[11px] sm:text-xs mt-0.5 absolute bottom-2 right-2 sm:right-3 whitespace-nowrap", message.sender === "bot" ? "text-blue-100" : "dark:text-slate-400 text-slate-600")}>
                        {formatMessageTime(message.created_at, userCountry)}
                      </p>
                    </div>
                  </div>
                </Fragment>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t dark:border-slate-700 border-blue-200 dark:bg-slate-800/50 bg-white/90 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
          <Input
            value={inputMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isSending}
            className="flex-1 h-11 sm:h-10 text-base sm:text-sm dark:bg-slate-700/50 bg-blue-50/50 dark:border-slate-600 border-blue-200 dark:text-slate-100 text-slate-800 dark:placeholder:text-slate-400 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
          />
          <Button 
            type="submit" 
            disabled={isSending || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-11 w-11 sm:h-10 sm:w-10 p-0 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
