"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: number
  title: string
  message: string
  shortcut?: string
  category?: string
  created_at: string
  updated_at: string
}

export function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    shortcut: "",
    category: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getTemplates()
      setTemplates(response.templates || [])
    } catch (error: any) {
      toast({
        title: "Error al cargar templates",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        title: template.title,
        message: template.message,
        shortcut: template.shortcut || "",
        category: template.category || "",
      })
    } else {
      setEditingTemplate(null)
      setFormData({ title: "", message: "", shortcut: "", category: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Error",
        description: "El título y mensaje son requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingTemplate) {
        await apiClient.updateTemplate(
          editingTemplate.id,
          formData.title,
          formData.message,
          formData.shortcut || undefined,
          formData.category || undefined
        )
        toast({ title: "✅ Template actualizado" })
      } else {
        await apiClient.createTemplate(
          formData.title,
          formData.message,
          formData.shortcut || undefined,
          formData.category || undefined
        )
        toast({ title: "✅ Template creado" })
      }
      
      setIsDialogOpen(false)
      loadTemplates()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este template?")) return

    try {
      await apiClient.deleteTemplate(id)
      toast({ title: "✅ Template eliminado" })
      loadTemplates()
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortcut?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {searchQuery ? "No se encontraron templates" : "No hay templates aún. ¡Crea uno!"}
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    {template.shortcut && (
                      <CardDescription className="mt-1">
                        Atajo: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm">{template.shortcut}</code>
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(template)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {template.message}
                </p>
                {template.category && (
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                    {template.category}
                  </span>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Nuevo Template"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ej: Saludo inicial"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                placeholder="El contenido del template..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shortcut">Atajo (opcional)</Label>
                <Input
                  id="shortcut"
                  placeholder="/hola"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría (opcional)</Label>
                <Input
                  id="category"
                  placeholder="Ej: saludo"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  maxLength={50}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
