// Componente para configurar notificaciones
"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { Bell, BellOff, Volume2, VolumeX, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationsSettings() {
  const {
    isSupported,
    permission,
    soundEnabled,
    notificationsEnabled,
    audioInitialized,
    requestPermission,
    toggleSound,
    toggleNotifications,
    testNotification,
    initializeSounds,
    canShowNotifications,
    needsPermission
  } = useNotifications()

  const [isRequesting, setIsRequesting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isInitializingAudio, setIsInitializingAudio] = useState(false)

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    try {
      await requestPermission()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestNotification = async () => {
    setIsTesting(true)
    try {
      await testNotification()
    } finally {
      setTimeout(() => setIsTesting(false), 2000)
    }
  }

  const handleInitializeAudio = async () => {
    setIsInitializingAudio(true)
    try {
      await initializeSounds()
    } finally {
      setIsInitializingAudio(false)
    }
  }

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: CheckCircle,
          text: 'Concedidos',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          variant: 'default' as const
        }
      case 'denied':
        return {
          icon: XCircle,
          text: 'Denegados',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          variant: 'destructive' as const
        }
      default:
        return {
          icon: AlertCircle,
          text: 'Pendientes',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          variant: 'secondary' as const
        }
    }
  }

  const permissionStatus = getPermissionStatus()
  const StatusIcon = permissionStatus.icon

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones no soportadas
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones push. Considera actualizar tu navegador para una mejor experiencia.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado de las Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo quieres recibir notificaciones de nuevos mensajes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de permisos */}
          <div className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full", permissionStatus.bgColor)}>
                <StatusIcon className={cn("h-4 w-4", permissionStatus.color)} />
              </div>
              <div>
                <p className="font-medium">Permisos del navegador</p>
                <p className="text-sm text-muted-foreground">
                  {permission === 'granted' && 'Puedes recibir notificaciones push'}
                  {permission === 'denied' && 'Habilita las notificaciones en la configuración del navegador'}
                  {permission === 'default' && 'Necesitas conceder permisos para recibir notificaciones'}
                </p>
              </div>
            </div>
            <Badge variant={permissionStatus.variant}>
              {permissionStatus.text}
            </Badge>
          </div>

          {/* Botón para solicitar permisos */}
          {needsPermission && (
            <Button 
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Solicitando permisos...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Habilitar Notificaciones
                </>
              )}
            </Button>
          )}

          {/* Mensaje para permisos denegados */}
          {permission === 'denied' && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Permisos denegados:</strong> Para habilitar las notificaciones, ve a la configuración de tu navegador y permite las notificaciones para este sitio.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuraciones */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Notificaciones</CardTitle>
          <CardDescription>
            Personaliza cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle notificaciones */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4 text-blue-600" />
                ) : (
                  <BellOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium">Notificaciones push</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Recibir notificaciones cuando lleguen nuevos mensajes
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={toggleNotifications}
            />
          </div>

          {/* Toggle sonido */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-blue-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium">Sonidos de notificación</span>
                {soundEnabled && !audioInitialized && (
                  <Badge variant="secondary" className="text-xs">
                    Requiere activación
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Reproducir sonido cuando lleguen mensajes
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={toggleSound}
            />
          </div>

          {/* Botón para inicializar audio si está habilitado pero no inicializado */}
          {soundEnabled && !audioInitialized && (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Audio no inicializado
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Los navegadores requieren una interacción del usuario para reproducir sonidos. Haz clic en el botón para activar el audio.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInitializeAudio}
                    disabled={isInitializingAudio}
                    className="mt-3 bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:border-yellow-700 dark:text-yellow-200"
                  >
                    {isInitializingAudio ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Inicializando...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Activar Audio
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Botón de prueba */}
          <div className="pt-4 border-t dark:border-slate-700">
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={isTesting || (!canShowNotifications && !soundEnabled)}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando prueba...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Probar Notificación
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {canShowNotifications || soundEnabled
                ? 'Envía una notificación de prueba para verificar que todo funciona'
                : 'Habilita las notificaciones o sonidos para probar'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Consejos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span>•</span>
            <span>Las notificaciones funcionan incluso cuando la pestaña está en segundo plano</span>
          </div>
          <div className="flex gap-2">
            <span>•</span>
            <span>Puedes personalizar el sonido y comportamiento desde la configuración del navegador</span>
          </div>
          <div className="flex gap-2">
            <span>•</span>
            <span>Las notificaciones se agrupan automáticamente para evitar spam</span>
          </div>
          <div className="flex gap-2">
            <span>•</span>
            <span>Haz clic en una notificación para ir directamente a la conversación</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
