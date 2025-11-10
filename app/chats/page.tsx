// [TAG: UI]
// [TAG: Mensajes]
// Main chat interface with conversation list and message thread

"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ConversationList } from "@/components/chat/conversation-list"
import { MessageThread } from "@/components/chat/message-thread"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"

export default function ChatsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  
  const token = apiClient.getToken()
  const { user } = useAuth()

  console.log("🏠 [CHATS-PAGE] Rendering with user:", user?.id, "token exists:", !!token)

  // Global Socket.IO listener for conversation updates
  useSocket({
    token,
    userId: user?.id?.toString(),
    onNewMessage: (newMessage: any) => {
      console.log("🌍 [CHATS-PAGE] Global new message received:", newMessage)
      // Update specific conversation and move to top when new message arrives
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          if (conv.id === newMessage.conversation_id) {
            return {
              ...conv,
              last_message: newMessage.message,
              last_message_time: newMessage.created_at
            }
          }
          return conv
        })
        
        // Sort by most recent message time (like WhatsApp)
        return updatedConversations.sort((a, b) => {
          const timeA = new Date(a.last_message_time || 0).getTime()
          const timeB = new Date(b.last_message_time || 0).getTime()
          return timeB - timeA
        })
      })
    },
    onConversationUpdated: (data: any) => {
      console.log("🔄 [CHATS-PAGE] Conversation updated event:", data)
      // Handle global conversation updates (reorder list immediately)
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              last_message: data.lastMessage,
              last_message_time: data.lastMessageTime
            }
          }
          return conv
        })
        
        // Sort by most recent message time (like WhatsApp) - ALWAYS reorder
        return updatedConversations.sort((a, b) => {
          const timeA = new Date(a.last_message_time || 0).getTime()
          const timeB = new Date(b.last_message_time || 0).getTime()
          return timeB - timeA
        })
      })
    },
    onConversationCreated: (newConversation: any) => {
      console.log("🆕 [CHATS-PAGE] New conversation created:", newConversation)
      // Add new conversation to the list
      setConversations(prev => {
        // Check if conversation already exists (prevent duplicates)
        const exists = prev.some(conv => conv.id === newConversation.id)
        if (exists) {
          console.log("⚠️ [CHATS-PAGE] Conversation already exists, skipping")
          return prev
        }
        
        // Add new conversation and sort by creation time
        const updatedConversations = [newConversation, ...prev]
        return updatedConversations.sort((a, b) => {
          const timeA = new Date(a.last_message_time || a.created_at || 0).getTime()
          const timeB = new Date(b.last_message_time || b.created_at || 0).getTime()
          return timeB - timeA
        })
      })
    },
    onConversationUpdate: () => {
      // Fallback: reload conversations if needed
      console.log("[DEBUG] Fallback conversation update")
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations()
    }
  }, [isAuthenticated])

  const loadConversations = async () => {
    try {
      const response = await apiClient.getConversations()
      // Sort conversations by most recent message time
      const sortedConversations = response.conversations.sort((a: any, b: any) => {
        const timeA = new Date(a.last_message_time || 0).getTime()
        const timeB = new Date(b.last_message_time || 0).getTime()
        return timeB - timeA
      })
      setConversations(sortedConversations)
    } catch (error: any) {
      toast({
        title: "Failed to load conversations",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 from-blue-50 via-white to-blue-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <div className="dark:text-slate-300 text-slate-700 text-lg font-medium">Cargando conversaciones...</div>
          <div className="dark:text-slate-500 text-slate-600 text-sm">Configurando tu espacio de trabajo</div>
        </div>
      </div>
    )
  }

  return (
    // Professional chat interface with modern design
    <div className="h-screen overflow-hidden flex bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 from-blue-50 via-white to-blue-100 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 dark:opacity-5 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)]"></div>
      </div>

      {/* Left sidebar - Conversation list */}
      <div className="w-full md:w-96 border-r dark:border-slate-700/50 border-blue-200/50 flex-shrink-0 dark:bg-slate-800/30 bg-white/90 backdrop-blur-xl relative z-10 shadow-2xl">
        <ConversationList
          ref={sidebarRef}
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Right side - Message thread */}
      <div className="flex-1 flex flex-col dark:bg-slate-900/20 bg-white/50 backdrop-blur-sm relative z-10">
        {selectedConversation ? (
          <div className="h-full animate-in slide-in-from-right-4 duration-300">
            <MessageThread
              conversation={selectedConversation}
              onConversationUpdate={loadConversations}
              onClose={() => {
                setSelectedConversation(null)
                // Return focus to the sidebar
                setTimeout(() => sidebarRef.current?.focus(), 0)
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 relative">
            <div className="text-center max-w-md mx-auto p-8 animate-in fade-in-50 duration-500">
              {/* Professional welcome illustration */}
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse"></div>
              </div>
              
              <h2 className="text-2xl font-bold dark:text-slate-100 text-slate-800 mb-3">
                Centro de WhatsApp Business
              </h2>
              <p className="dark:text-slate-400 text-slate-600 mb-6 leading-relaxed">
                Selecciona una conversación de la barra lateral para comenzar a gestionar las comunicaciones con tus clientes
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-1 gap-4 text-left">
                <div className="flex items-center gap-3 p-3 rounded-lg dark:bg-slate-800/30 bg-white/50 border dark:border-slate-700/30 border-slate-300/30">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium dark:text-slate-200 text-slate-700">Mensajería en tiempo real</div>
                    <div className="text-xs dark:text-slate-500 text-slate-600">Comunicación instantánea con clientes</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg dark:bg-slate-800/30 bg-white/50 border dark:border-slate-700/30 border-slate-300/30">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium dark:text-slate-200 text-slate-700">Seguro y encriptado</div>
                    <div className="text-xs dark:text-slate-500 text-slate-600">Protección de extremo a extremo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
