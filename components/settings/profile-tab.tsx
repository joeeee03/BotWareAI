"use client"

import { useState } from "react"
import { User, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface ProfileTabProps {
  userEmail: string
  initialDisplayName?: string
  onDisplayNameUpdate?: (name: string) => void
}

export function ProfileTab({ userEmail, initialDisplayName, onDisplayNameUpdate }: ProfileTabProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName || "")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "El nombre para mostrar es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      await apiClient.updateDisplayName(displayName.trim())
      
      // Notify parent component of the update
      if (onDisplayNameUpdate) {
        onDisplayNameUpdate(displayName.trim())
      }
      
      toast({ title: "✅ Perfil actualizado" })
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Perfil
          </CardTitle>
          <CardDescription>
            Configura tu información personal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-slate-50 dark:bg-slate-900"
            />
            <p className="text-xs text-slate-500">
              El email no se puede modificar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre para mostrar *</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Tu nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-slate-500">
              Este nombre se mostrará en la interfaz
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
