"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Edit, Trash2, Calendar, Users, CheckCircle, XCircle, Clock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { VariableInserter } from "@/components/ui/variable-inserter"
import { MessageWithVariables } from "@/components/ui/message-with-variables"

interface ScheduledMessage {
  id: number
  bot_id: number
  conversation_ids: number[]
  message: string
  scheduled_for: string
  status: string
  sent_at?: string
  error_message?: string
  created_at: string
}

export function ScheduledMessagesTab() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [formData, setFormData] = useState({
    message: "",
    scheduled_date: "",
    scheduled_time: "",
    selected_conversations: [] as number[],
  })

  const { toast } = useToast()

  useEffect(() => {
    loadScheduledMessages()
    loadConversations()
  }, [])

  const loadScheduledMessages = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getScheduledMessages()
      setMessages(response.scheduled_messages || [])
    } catch (error: any) {
      toast({
        title: "Error al cargar mensajes programados",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await apiClient.getConversations(100, 0)
      setConversations(response.conversations || [])
    } catch (error: any) {
      console.error("Error loading conversations:", error)
    }
  }

  const handleOpenDialog = (message?: ScheduledMessage) => {
    if (message) {
      // Editing existing message
      setEditingMessage(message)
      const scheduled = new Date(message.scheduled_for)
      setFormData({
        message: message.message,
        scheduled_date: scheduled.toISOString().split('T')[0],
        scheduled_time: scheduled.toTimeString().slice(0, 5),
        selected_conversations: message.conversation_ids,
      })
    } else {
      // Creating new message - set default to now + 1 minute
      setEditingMessage(null)
      const now = new Date()
      now.setMinutes(now.getMinutes() + 1)
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toTimeString().slice(0, 5)
      
      setFormData({
        message: "",
        scheduled_date: dateStr,
        scheduled_time: timeStr,
        selected_conversations: [],
      })
    }
    setIsDialogOpen(true)
  }

  const handleSchedule = async (sendNow = false) => {
    if (!formData.message.trim()) {
      toast({ title: "Error", description: "El mensaje es requerido", variant: "destructive" })
      return
    }

    if (formData.selected_conversations.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos una conversación", variant: "destructive" })
      return
    }

    if (!sendNow && (!formData.scheduled_date || !formData.scheduled_time)) {
      toast({ title: "Error", description: "Fecha y hora son requeridas", variant: "destructive" })
      return
    }

    let scheduledFor: Date
    if (sendNow) {
      scheduledFor = new Date()
    } else {
      scheduledFor = new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00`)
      
      if (scheduledFor <= new Date()) {
        toast({ title: "Error", description: "La fecha y hora deben ser futuras", variant: "destructive" })
        return
      }
    }

    try {
      // Get bot_id from first conversation
      const firstConv = conversations.find(c => c.id === formData.selected_conversations[0])
      if (!firstConv) {
        toast({ title: "Error", description: "No se encontró la conversación", variant: "destructive" })
        return
      }

      if (editingMessage && sendNow) {
        // Send now: cancel old and create new with current time
        await apiClient.cancelScheduledMessage(editingMessage.id)
        await apiClient.createScheduledMessage(
          firstConv.bot_id,
          formData.selected_conversations,
          formData.message,
          scheduledFor.toISOString()
        )
        toast({ title: "✅ Mensaje enviado" })
      } else if (editingMessage) {
        // Update: cancel old and recreate
        await apiClient.cancelScheduledMessage(editingMessage.id)
        await apiClient.createScheduledMessage(
          firstConv.bot_id,
          formData.selected_conversations,
          formData.message,
          scheduledFor.toISOString()
        )
        toast({ title: "✅ Mensaje actualizado" })
      } else {
        // Create new scheduled message
        await apiClient.createScheduledMessage(
          firstConv.bot_id,
          formData.selected_conversations,
          formData.message,
          scheduledFor.toISOString()
        )
        toast({ title: "✅ Mensaje programado" })
      }
      
      setIsDialogOpen(false)
      setEditingMessage(null)
      loadScheduledMessages()
    } catch (error: any) {
      toast({
        title: sendNow ? "Error al enviar" : "Error al programar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm("¿Cancelar este mensaje programado?")) return

    try {
      await apiClient.cancelScheduledMessage(id)
      toast({ title: "✅ Mensaje cancelado" })
      loadScheduledMessages()
    } catch (error: any) {
      toast({
        title: "Error al cancelar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>
      case "sent":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Enviado</Badge>
      case "failed":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Fallido</Badge>
      case "cancelled":
        return <Badge variant="outline" className="gap-1">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredMessages = filterStatus === "all" 
    ? messages 
    : messages.filter(m => m.status === filterStatus)

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="sent">Enviados</option>
          <option value="failed">Fallidos</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <Button onClick={() => handleOpenDialog()} className="gap-2 ml-auto">
          <Plus className="h-4 w-4" />
          Programar Mensaje
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No hay mensajes programados
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <Card key={msg.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {format(new Date(msg.scheduled_for), "PPP 'a las' HH:mm", { locale: es })}
                      </CardTitle>
                      {getStatusBadge(msg.status)}
                    </div>
                    <CardDescription className="mt-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {msg.conversation_ids.length} conversación(es)
                    </CardDescription>
                  </div>
                  {msg.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(msg)}
                        className="h-8 w-8"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancel(msg.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        title="Cancelar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <MessageWithVariables text={msg.message} className="text-sm whitespace-pre-wrap" />
                {msg.error_message && (
                  <p className="text-xs text-red-600 mt-2">Error: {msg.error_message}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog para programar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingMessage ? "Editar Mensaje Programado" : "Programar Mensaje"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message">Mensaje *</Label>
                <VariableInserter
                  onInsert={(variable) => {
                    const textarea = messageTextareaRef.current
                    if (!textarea) return
                    const cursorPos = textarea.selectionStart || formData.message.length
                    const newMessage =
                      formData.message.slice(0, cursorPos) + variable + formData.message.slice(cursorPos)
                    setFormData({ ...formData, message: newMessage })
                    // Focus back and set cursor position
                    setTimeout(() => {
                      textarea.focus()
                      const newPos = cursorPos + variable.length
                      textarea.setSelectionRange(newPos, newPos)
                    }, 0)
                  }}
                />
              </div>
              <Textarea
                ref={messageTextareaRef}
                id="message"
                placeholder="El mensaje a enviar... Usa el botón {} para insertar variables"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
              />
              {formData.message && (
                <div className="mt-2 p-3 rounded-md bg-slate-50 dark:bg-slate-900 border dark:border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Vista previa:</p>
                  <MessageWithVariables text={formData.message} className="text-sm" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Fecha *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Hora *</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Destinatarios * (selecciona conversaciones)</Label>
              <div className="border rounded-md p-3 max-h-60 overflow-auto space-y-2 dark:border-slate-700">
                {conversations.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay conversaciones disponibles</p>
                ) : (
                  conversations.map((conv) => (
                    <label key={conv.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selected_conversations.includes(conv.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              selected_conversations: [...formData.selected_conversations, conv.id],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              selected_conversations: formData.selected_conversations.filter(id => id !== conv.id),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{conv.customer_name || conv.customer_phone}</p>
                        <p className="text-xs text-slate-500">{conv.customer_phone}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500">
                {formData.selected_conversations.length} seleccionada(s)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingMessage(null); }}>
              Cancelar
            </Button>
            {editingMessage && (
              <Button onClick={() => handleSchedule(true)} variant="secondary" className="gap-2">
                <Send className="h-4 w-4" />
                Enviar Ahora
              </Button>
            )}
            <Button onClick={() => handleSchedule(false)}>
              {editingMessage ? "Actualizar" : "Programar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
