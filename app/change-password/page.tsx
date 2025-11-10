// [TAG: Autenticación]
// [TAG: UI]
// Change password page for first-time login

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { refreshUser } = useAuth()

  useEffect(() => {
    // If we were redirected from login with a temporary current password, prefill it
    if (typeof window !== "undefined") {
      const tmp = sessionStorage.getItem("force_current_password")
      if (tmp) setCurrentPassword(tmp)
    }
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Asegúrate de ingresar la misma contraseña dos veces",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Contraseña demasiado corta",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await apiClient.changePassword(currentPassword, newPassword)

      // Clear temporary stored password
      if (typeof window !== "undefined") sessionStorage.removeItem("force_current_password")

      // Refresh user data to update requirePasswordChange flag
      await refreshUser()

      toast({
        title: "Contraseña actualizada",
        description: "Ya puede acceder a sus conversaciones",
      })

      // The AuthProvider will handle the redirect automatically
    } catch (error: any) {
      toast({
        title: "Error al cambiar la contraseña",
        description: error.message || "Ocurrió un error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-100">Cambiar contraseña</CardTitle>
          <CardDescription className="text-center text-slate-300">Por seguridad, debe actualizar su contraseña antes de acceder a las conversaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-slate-200">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-200">Contraseña nueva</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Ingrese la nueva contraseña (mín 8 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
