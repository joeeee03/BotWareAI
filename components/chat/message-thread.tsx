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
import { Send, Image as ImageIcon, Video, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatWhatsAppText } from "@/lib/whatsapp-formatter"
import { formatMessageTime, getUserCountry, formatDateSeparator, isSameDayInTimezone } from "@/lib/timezone-utils"
import { TemplatesMenu } from "./templates-menu"
import { VariableInserter } from "@/components/ui/variable-inserter"
import { RichTextInput } from "@/components/ui/rich-text-input"
import { MultimediaMessage } from "./multimedia-message"
import { useNotifications } from "@/hooks/use-notifications"

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
  type?: "text" | "image" | "video" | "audio"
  url?: string | null
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
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false)
  const [templatesSearch, setTemplatesSearch] = useState("")
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousMessagesLengthRef = useRef(0)
  const newestMessageIdRef = useRef<number | null>(null)
  const { toast } = useToast()
  const userCountry = getUserCountry()
  
  // Hook de notificaciones
  const { notifyNewMessage, playSound } = useNotifications()

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
      console.log("📨 [MESSAGE-THREAD] Message type:", newMessage.type)
      console.log("📨 [MESSAGE-THREAD] Message url:", newMessage.url)
      console.log("📨 [MESSAGE-THREAD] Current conversation ID:", conversation?.id)
      
      if (newMessage.conversation_id === conversation?.id) {
        console.log("✅ [MESSAGE-THREAD] Adding message to current conversation")
        console.log("💬 [MESSAGE-THREAD] Message content being added:", newMessage.message)
        console.log("🖼️ [MESSAGE-THREAD] Message type being added:", newMessage.type)
        console.log("🔗 [MESSAGE-THREAD] Message URL being added:", newMessage.url)
        
        setMessages((prev) => {
          // Check if message already exists by ID
          const existsById = newMessage.id && newMessage.id > 0 && prev.some((m) => m.id === newMessage.id)
          
          if (existsById) {
            console.log("⚠️ [MESSAGE-THREAD] Message already exists, skipping", { 
              messageId: newMessage.id 
            })
            return prev
          }
          
          console.log("✨ [MESSAGE-THREAD] Appending new message with text:", newMessage.message)
          
          // 🔔 NOTIFICACIONES: Solo notificar si el mensaje es del usuario (no del bot)
          if (newMessage.sender === 'user') {
            const senderName = conversation?.customer_name || conversation?.customer_phone || 'Usuario'
            
            // Verificar si la ventana está en foco
            const isWindowFocused = document.hasFocus()
            const isTabVisible = !document.hidden
            
            // Solo notificar si la ventana no está en foco o la pestaña no es visible
            if (!isWindowFocused || !isTabVisible) {
              console.log("🔔 [NOTIFICATIONS] Enviando notificación para mensaje de:", senderName)
              
              // Formatear mensaje para notificación
              let notificationMessage = newMessage.message
              if (newMessage.type === 'image') {
                notificationMessage = '📷 Imagen'
              } else if (newMessage.type === 'video') {
                notificationMessage = '🎥 Video'
              } else if (newMessage.type === 'audio') {
                notificationMessage = '🎵 Audio'
              }
              
              // Enviar notificación
              notifyNewMessage(senderName, notificationMessage, conversation?.id)
            } else {
              // Si la ventana está en foco, solo reproducir sonido suave
              console.log("🔔 [NOTIFICATIONS] Ventana en foco, solo reproduciendo sonido")
              playSound('message')
            }
          }
          
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

    socket.on("message:new", handleNewMessage)

    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [socket, conversation?.id, onConversationUpdate])

  useEffect(() => {
    if (conversation?.id) {
      loadMessages()
      // Auto-focus en el input cuando se abre el chat
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [conversation?.id])

  // Auto-focus del input al presionar teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el input ya tiene focus, no hacer nada
      if (document.activeElement === inputRef.current) return
      
      // Si la tecla es ESC, no hacer nada (para cerrar el chat)
      if (e.key === 'Escape') return
      
      // Si presionó una tecla de escritura (letra, número, espacio, etc.)
      // y no es una combinación con Ctrl/Alt/Meta
      if (
        !e.ctrlKey && 
        !e.altKey && 
        !e.metaKey && 
        e.key.length === 1 && 
        !e.repeat
      ) {
        console.log('🎹 [INPUT] Auto-focusing input on keypress:', e.key)
        inputRef.current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputMessage(value)
    
    // Check if user typed "/" to show templates menu
    if (value.startsWith("/")) {
      setShowTemplatesMenu(true)
      setTemplatesSearch(value.slice(1)) // Remove the "/"
    } else {
      setShowTemplatesMenu(false)
      setTemplatesSearch("")
    }
  }

  const handleTemplateSelect = (templateMessage: string) => {
    setInputMessage(templateMessage)
    setShowTemplatesMenu(false)
    setTemplatesSearch("")
    inputRef.current?.focus()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      })
      return
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de video válido",
        variant: "destructive",
      })
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 50MB",
        variant: "destructive",
      })
      return
    }

    setAttachedFile(file)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setAttachedFilePreview(previewUrl)
  }

  const removeAttachedFile = () => {
    if (attachedFilePreview) {
      URL.revokeObjectURL(attachedFilePreview)
    }
    setAttachedFile(null)
    setAttachedFilePreview(null)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!inputMessage.trim() && !attachedFile) || isSending) return

    const messageText = inputMessage.trim()
    setInputMessage("")
    setShowTemplatesMenu(false)
    setTemplatesSearch("")
    setIsSending(true)

    try {
      let messageType = 'text'
      let fileUrl = null

      // Upload file if attached
      if (attachedFile) {
        setIsUploading(true)
        
        const isImage = attachedFile.type.startsWith('image/')
        const isVideo = attachedFile.type.startsWith('video/')
        
        if (isImage) {
          messageType = 'image'
          const uploadResult = await apiClient.uploadImage(attachedFile)
          fileUrl = uploadResult.url
        } else if (isVideo) {
          messageType = 'video'
          const uploadResult = await apiClient.uploadVideo(attachedFile)
          fileUrl = uploadResult.url
        }
        
        setIsUploading(false)
        removeAttachedFile()
      }

      // Send message with or without file
      await apiClient.sendMessage(
        conversation.id.toString(), 
        messageText || '', 
        undefined, 
        messageType, 
        fileUrl || undefined
      )
      
      // Message will appear automatically when it comes back via Socket.IO from realtime-listener
      onConversationUpdate()
    } catch (error: any) {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      })
      setIsUploading(false)
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
      {/* Header - OPTIMIZADO PARA MÓVIL */}
      <div className="p-2 sm:p-4 border-b dark:border-slate-700 border-blue-200 flex items-center justify-between dark:bg-slate-800/50 bg-white/90 shadow-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Botón volver para móviles - Más compacto */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg dark:bg-slate-700/50 bg-blue-100/50 dark:text-slate-300 text-slate-600 hover:dark:bg-slate-600/50 hover:bg-blue-200/50 transition-colors flex-shrink-0 active:scale-95"
            aria-label="Volver a conversaciones"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Avatar y info del contacto */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Avatar con inicial */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm sm:text-base">
                {(conversation.customer_name || conversation.customer_phone)?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold dark:text-slate-100 text-slate-800 text-sm sm:text-lg truncate leading-tight">
                {conversation.customer_name || conversation.customer_phone}
              </h2>
              {/* Solo mostrar teléfono si es diferente del nombre */}
              {conversation.customer_name && conversation.customer_name !== conversation.customer_phone && (
                <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 truncate leading-tight">
                  {conversation.customer_phone}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Status indicator - Más compacto en móvil */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {isLoading && (
            <div className="text-xs dark:text-slate-400 text-slate-500 animate-pulse hidden sm:block">
              Cargando...
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full dark:bg-slate-700/50 bg-blue-100/50">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-400" : "bg-red-400")} />
            <span className="text-xs dark:text-slate-300 text-slate-600 font-medium hidden sm:inline">
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
                          ? "bg-blue-600 text-white"
                          : "dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 bg-blue-50 text-slate-800 border border-blue-200",
                      )}
                    >
                      <div className="pr-[52px]">
                        <MultimediaMessage
                          type={message.type || "text"}
                          message={message.message}
                          url={message.url || null}
                          sender={message.sender}
                        />
                      </div>
                      <p className={cn("text-[11px] sm:text-xs mt-0.5 absolute bottom-2 right-3 whitespace-nowrap", message.sender === "bot" ? "text-blue-100" : "dark:text-slate-400 text-slate-600")}>
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
      <div className="p-3 sm:p-4 border-t dark:border-slate-700 border-blue-200 dark:bg-slate-800/50 bg-white/90 shadow-lg relative">
        {/* File Preview */}
        {attachedFilePreview && (
          <div className="mb-3 p-3 rounded-lg dark:bg-slate-700/50 bg-blue-50 border dark:border-slate-600 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                {attachedFile?.type.startsWith('image/') ? (
                  <img 
                    src={attachedFilePreview} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-slate-800 rounded-lg">
                    <Video className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium dark:text-slate-200 text-slate-800 truncate">
                  {attachedFile?.name}
                </p>
                <p className="text-xs dark:text-slate-400 text-slate-600">
                  {attachedFile && (attachedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={removeAttachedFile}
                className="flex-shrink-0 p-1 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* LAYOUT OPTIMIZADO PARA MÓVIL - Evita que el botón se vaya muy a la derecha */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-1 sm:gap-2">
          {/* Botones de multimedia - Solo en desktop o cuando no hay texto */}
          <div className={cn(
            "flex gap-1 transition-all duration-200",
            // En móvil, ocultar botones cuando hay texto para dar más espacio
            inputMessage.trim() ? "hidden sm:flex" : "flex"
          )}>
            {/* Image upload button */}
            <label className="flex-shrink-0 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'image')}
                disabled={isSending || isUploading || !!attachedFile}
              />
              <div className={cn(
                "h-10 w-10 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-all",
                attachedFile || isSending || isUploading
                  ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 active:scale-95"
              )}>
                <ImageIcon className="h-4 w-4" />
              </div>
            </label>

            {/* Video upload button */}
            <label className="flex-shrink-0 cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'video')}
                disabled={isSending || isUploading || !!attachedFile}
              />
              <div className={cn(
                "h-10 w-10 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-all",
                attachedFile || isSending || isUploading
                  ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                  : "bg-purple-600/20 text-purple-500 hover:bg-purple-600/30 active:scale-95"
              )}>
                <Video className="h-4 w-4" />
              </div>
            </label>
          </div>

          {/* Input container - Toma el espacio disponible */}
          <div className="flex-1 min-w-0 relative">
            {showTemplatesMenu && (
              <TemplatesMenu
                onSelect={handleTemplateSelect}
                onClose={() => setShowTemplatesMenu(false)}
                searchQuery={templatesSearch}
              />
            )}
            <div className="relative">
              <RichTextInput
                value={inputMessage}
                onChange={(value) => {
                  setInputMessage(value)
                  // Check for / to show templates menu
                  if (value.endsWith('/')) {
                    setShowTemplatesMenu(true)
                    setTemplatesSearch('')
                  } else if (value.includes('/')) {
                    const lastSlashIndex = value.lastIndexOf('/')
                    const searchTerm = value.slice(lastSlashIndex + 1)
                    setTemplatesSearch(searchTerm)
                  } else {
                    setShowTemplatesMenu(false)
                  }
                }}
                onKeyDown={(e) => {
                  // Si el menú de templates está abierto, no enviar mensaje con Enter
                  if (e.key === 'Enter' && !e.shiftKey && !showTemplatesMenu) {
                    e.preventDefault()
                    handleSendMessage(e as any)
                  }
                }}
                placeholder="Escribe un mensaje..."
                disabled={isSending || isUploading}
                singleLine={true}
                className="h-10 w-full text-sm dark:bg-slate-700/50 bg-blue-50/50 dark:border-slate-600 border-blue-200 dark:text-slate-100 text-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-lg pr-8"
              />
              {/* Variable inserter - Solo visible en desktop */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:block">
                <VariableInserter
                  onInsert={(variable) => {
                    const newMessage = inputMessage + variable
                    setInputMessage(newMessage)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Send button - Siempre visible y del mismo tamaño */}
          <Button 
            type="submit" 
            disabled={isSending || isUploading || (!inputMessage.trim() && !attachedFile)}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-10 w-10 p-0 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
