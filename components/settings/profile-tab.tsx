"use client"

import { useState } from "react"
import { User, Save, Lock } from "lucide-react"
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
  
  // Password change state
  const [pwCurrent, setPwCurrent] = useState("")
  const [pwNew, setPwNew] = useState("")
  const [pwConfirm, setPwConfirm] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
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

  const handlePasswordChange = async () => {
    if (pwNew.trim().length < 8) {
      toast({ 
        title: "Error", 
        description: "La contraseña debe tener al menos 8 caracteres", 
        variant: "destructive" 
      })
      return
    }
    
    if (pwNew !== pwConfirm) {
      toast({ 
        title: "Error", 
        description: "Las contraseñas no coinciden", 
        variant: "destructive" 
      })
      return
    }

    try {
      setIsChangingPassword(true)
      await apiClient.changePassword(pwCurrent.trim(), pwNew.trim())
      
      // Clear password fields
      setPwCurrent("")
      setPwNew("")
      setPwConfirm("")
      
      toast({ title: "✅ Contraseña actualizada" })
    } catch (error: any) {
      toast({
        title: "Error al cambiar contraseña",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
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

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña de acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña actual *</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Tu contraseña actual"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña *</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nueva contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite la nueva contraseña"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
            />
          </div>

          <Button 
            onClick={handlePasswordChange} 
            disabled={isChangingPassword || !pwCurrent || !pwNew || !pwConfirm}
            className="gap-2"
            variant="secondary"
          >
            <Lock className="h-4 w-4" />
            {isChangingPassword ? "Cambiando..." : "Cambiar Contraseña"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
