// [TAG: UI]
// Conversation list component

"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatConversationTime, getUserCountry } from "@/lib/timezone-utils"
import { stripWhatsAppFormatting } from "@/lib/whatsapp-formatter"
import { getCountryList, setUserCountry } from "@/lib/timezone-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { Sun, Moon, Settings, User, Lock, LogOut, Palette } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ConversationListProps {
  conversations: any[]
  selectedConversation: any
  onSelectConversation: (conversation: any) => void
}

export const ConversationList = React.forwardRef<HTMLDivElement, ConversationListProps>(
  ({ conversations, selectedConversation, onSelectConversation }, ref) => {
    const [query, setQuery] = useState("")
    const userCountry = getUserCountry()

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Deduplicate conversations by id (some seeds or updates may produce duplicates)
  const deduped = React.useMemo(() => {
    // Build a map keyed by id when available, otherwise by phone+name.
    // When collisions occur prefer the conversation that has a last_message or a newer last_message_time.
    const map = new Map<string, any>()
    for (const c of conversations || []) {
      const key = c.id != null ? `id:${c.id}` : `contact:${(c.customer_phone || c.customer_name || "").toString()}`

      if (!map.has(key)) {
        map.set(key, c)
        continue
      }

      const existing = map.get(key)
      const existingHasLast = !!(existing.last_message || existing.last_message_time)
      const currentHasLast = !!(c.last_message || c.last_message_time)

      // prefer the one that has last message
      if (currentHasLast && !existingHasLast) {
        map.set(key, c)
        continue
      }

      // if both have last_message_time, prefer newer
      if (currentHasLast && existingHasLast && c.last_message_time && existing.last_message_time) {
        const currTime = new Date(c.last_message_time).getTime()
        const existTime = new Date(existing.last_message_time).getTime()
        if (currTime > existTime) map.set(key, c)
      }
    }

    return Array.from(map.values())
  }, [conversations])

  const filtered = React.useMemo(() => {
    if (!query.trim()) return deduped
    const q = query.toLowerCase()
    return deduped
      .filter((c) => {
        // Remove obvious empty placeholder conversations (no last message and no last_message_time)
        // unless the user explicitly searches for them.
        const hasLast = !!(c.last_message || c.last_message_time)
        return hasLast || c.customer_name?.toLowerCase().includes(q) || c.customer_phone?.toLowerCase().includes(q)
      })
      .filter((c) => {
        // Further filter by query matching name/phone/last
        const name = (c.customer_name || "").toString().toLowerCase()
        const phone = (c.customer_phone || "").toString().toLowerCase()
        const last = (c.last_message || "").toString().toLowerCase()
        return name.includes(q) || phone.includes(q) || last.includes(q)
      })
  }, [deduped, query])

  const { theme, resolvedTheme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user, logout } = useAuth()

  const [open, setOpen] = React.useState(false)
  // General settings state
  const [displayName, setDisplayName] = useState("")
  const [selectedCountry, setSelectedCountry] = useState(userCountry)
  // Password change state (independent)
  const [pwCurrent, setPwCurrent] = useState("")
  const [pwNew, setPwNew] = useState("")
  const [pwConfirm, setPwConfirm] = useState("")
  const [isChanging, setIsChanging] = useState(false)
  
  const countryList = getCountryList()

  // Load initial display name from localStorage user if present
  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null
      if (raw) {
        const u = JSON.parse(raw)
        if (u?.name || u?.customer_name) setDisplayName(u.name || u.customer_name)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const handleSaveGeneral = async () => {
    // Save displayName and country locally
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null
      const user = raw ? JSON.parse(raw) : {}
      user.name = displayName
      if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(user))
      
      // Save country selection
      setUserCountry(selectedCountry)
      
      toast({ title: "Configuración guardada", variant: "default" })
      setOpen(false)
      
      // Refresh page to apply timezone changes
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Error guardando configuración", description: String(err), variant: "destructive" })
    }
  }

  const handleConfirmPasswordChange = async () => {
    if (pwNew.trim().length < 8) {
      toast({ title: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" })
      return
    }
    if (pwNew !== pwConfirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" })
      return
    }

    setIsChanging(true)
    try {
      await apiClient.changePassword(pwCurrent.trim(), pwNew.trim())
      toast({ title: "Contraseña actualizada", variant: "default" })
      setPwNew("")
      setPwConfirm("")
      // keep dialog open to allow further actions
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" })
    } finally {
      setIsChanging(false)
    }
  }

  return (
    // Use h-full so the container inherits the parent's height; parent (page) is h-screen
    <div ref={ref as any} tabIndex={0} className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b dark:border-slate-700/50 border-blue-200/50 dark:bg-slate-800/50 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:dark:bg-slate-800/30 supports-[backdrop-filter]:bg-white/90 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold dark:text-slate-100 text-slate-800 flex items-center gap-2 animate-slideIn">
              <svg className="h-6 w-6 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chats
            </h1>
            <p className="text-sm dark:text-slate-400 text-slate-600">{deduped.length} conversaciones activas</p>
          </div>
          <div className="flex items-center gap-2">
            {/* User Avatar and Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-semibold">
                      {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 dark:bg-slate-800/95 bg-white/95 backdrop-blur-xl dark:border-slate-700/50 border-blue-200/50 shadow-2xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none dark:text-slate-100 text-slate-800">
                      {displayName || 'Usuario'}
                    </p>
                    <p className="text-xs leading-none dark:text-slate-400 text-slate-600">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpen(true)} className="dark:text-slate-200 text-slate-700 dark:hover:bg-slate-700 hover:bg-blue-50">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="dark:text-slate-200 text-slate-700 dark:hover:bg-slate-700 hover:bg-blue-50">
                  {resolvedTheme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Modo claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Modo oscuro</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-slate-700 bg-blue-200" />
                <DropdownMenuItem onClick={logout} className="text-red-500 dark:hover:bg-slate-700 hover:bg-red-50 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings" className="hidden">
                  <Settings />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Configuración del perfil
                  </DialogTitle>
                  <DialogDescription>
                    Gestiona tu información personal y configuración de seguridad.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* User Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-semibold text-lg">
                          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{displayName || 'Usuario'}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nombre para mostrar</Label>
                      <Input 
                        id="displayName"
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        placeholder="Ingresa tu nombre" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">País (zona horaria)</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu país" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryList.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* Security Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <h4 className="font-medium">Seguridad</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña actual</Label>
                        <Input 
                          id="currentPassword"
                          type="password" 
                          value={pwCurrent} 
                          onChange={(e) => setPwCurrent(e.target.value)}
                          placeholder="Ingresa tu contraseña actual"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva contraseña</Label>
                        <Input 
                          id="newPassword"
                          type="password" 
                          value={pwNew} 
                          onChange={(e) => setPwNew(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                        <Input 
                          id="confirmPassword"
                          type="password" 
                          value={pwConfirm} 
                          onChange={(e) => setPwConfirm(e.target.value)}
                          placeholder="Confirma tu nueva contraseña"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={handleSaveGeneral} variant="secondary" className="flex-1 sm:flex-none">
                      Guardar perfil
                    </Button>
                    <Button 
                      onClick={handleConfirmPasswordChange} 
                      disabled={isChanging || !pwCurrent || !pwNew || !pwConfirm}
                      className="flex-1 sm:flex-none"
                    >
                      {isChanging ? "Cambiando..." : "Cambiar contraseña"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="relative group">
            <Input
              placeholder="Buscar conversaciones..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              aria-label="Search conversations"
              className="pl-10 dark:bg-slate-700/30 bg-blue-50/50 dark:border-slate-600/50 border-blue-200/50 dark:text-slate-100 text-slate-800 dark:placeholder:text-slate-400 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 group-hover:scale-110 transition-transform duration-200">
              <svg className="h-4 w-4 dark:text-slate-400 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 overflow-y-auto smooth-scrollbar">
        <div className="divide-y dark:divide-slate-700 divide-blue-100">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full dark:bg-slate-700 bg-blue-100 p-3 mb-4">
                <svg className="h-6 w-6 dark:text-slate-400 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-medium text-sm dark:text-slate-200 text-slate-700">No hay conversaciones</h3>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">
                {query ? "No se encontraron resultados" : "Las conversaciones aparecerán aquí"}
              </p>
            </div>
          ) : (
            filtered.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={cn(
                  "w-full p-3 sm:p-4 flex items-start gap-3 dark:hover:bg-slate-700/30 hover:bg-blue-50/50 transition-all duration-200 text-left relative group touch-manipulation",
                  "active:scale-[0.98]",
                  selectedConversation?.id === conversation.id && "dark:bg-slate-700/50 bg-blue-100/70 border-r-4 border-blue-500 shadow-lg",
                )}
                style={{ animationDelay: `${filtered.indexOf(conversation) * 30}ms` }}
              >
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-blue-400/50">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-base sm:text-lg transition-all duration-300">
                    {getInitials(conversation.customer_name || conversation.customer_phone)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold dark:text-slate-100 text-slate-800 text-[15px] sm:text-base transition-colors duration-200 group-hover:text-blue-500 truncate flex-1 min-w-0">
                      {conversation.customer_name || conversation.customer_phone}
                    </h3>
                    {conversation.last_message_time && (
                      <span className="text-xs sm:text-[11px] dark:text-slate-400 text-slate-500 whitespace-nowrap flex-shrink-0">
                        {formatConversationTime(conversation.last_message_time, userCountry)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] sm:text-xs dark:text-slate-400 text-slate-600 line-clamp-1 flex-1 min-w-0">
                      {conversation.last_message ? (
                        <>
                          {(() => {
                            const showPrefix = conversation.last_message_sender === 'bot' || conversation.last_message_sender === 'assistant'
                            if (filtered.indexOf(conversation) === 0) {
                              console.log('[CONVERSATION-LIST] First conversation sender:', {
                                sender: conversation.last_message_sender,
                                showPrefix,
                                message: conversation.last_message?.substring(0, 30)
                              })
                            }
                            return showPrefix ? <span className="font-bold dark:text-slate-300 text-slate-700">Tú: </span> : null
                          })()}
                          {stripWhatsAppFormatting(conversation.last_message)}
                        </>
                      ) : "Sin mensajes aún"}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[11px] font-bold leading-none text-white bg-blue-500 rounded-full shadow-lg flex-shrink-0">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
})

ConversationList.displayName = "ConversationList"
