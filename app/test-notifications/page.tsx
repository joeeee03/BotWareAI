"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from '@/hooks/use-notifications'
import { Bell, Volume2, TestTube } from 'lucide-react'

export default function TestNotificationsPage() {
  const {
    isSupported,
    permission,
    soundEnabled,
    notificationsEnabled,
    audioInitialized,
    requestPermission,
    notifyNewMessage,
    playSound,
    initializeSounds,
    canShowNotifications
  } = useNotifications()

  const [isTestingSound, setIsTestingSound] = useState(false)
  const [isTestingNotification, setIsTestingNotification] = useState(false)

  const handleTestSound = async () => {
    setIsTestingSound(true)
    try {
      console.log('🔊 [TEST] Probando sonido...')
      await playSound('message')
      console.log('✅ [TEST] Sonido reproducido')
    } catch (error) {
      console.error('❌ [TEST] Error reproduciendo sonido:', error)
    } finally {
      setTimeout(() => setIsTestingSound(false), 1000)
    }
  }

  const handleTestNotification = async () => {
    setIsTestingNotification(true)
    try {
      console.log('🔔 [TEST] Probando notificación...')
      await notifyNewMessage('Usuario de Prueba', 'Este es un mensaje de prueba para verificar que las notificaciones funcionan correctamente 🎉')
      console.log('✅ [TEST] Notificación enviada')
    } catch (error) {
      console.error('❌ [TEST] Error enviando notificación:', error)
    } finally {
      setTimeout(() => setIsTestingNotification(false), 2000)
    }
  }

  const handleInitializeAudio = async () => {
    try {
      console.log('🔊 [TEST] Inicializando audio...')
      await initializeSounds()
      console.log('✅ [TEST] Audio inicializado')
    } catch (error) {
      console.error('❌ [TEST] Error inicializando audio:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Prueba de Notificaciones
          </CardTitle>
          <CardDescription>
            Página para probar que las notificaciones y sonidos funcionen correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado actual */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-sm font-medium">Soporte</p>
              <p className="text-xs text-muted-foreground">
                {isSupported ? '✅ Soportado' : '❌ No soportado'}
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm font-medium">Permisos</p>
              <p className="text-xs text-muted-foreground">
                {permission === 'granted' ? '✅ Concedidos' : 
                 permission === 'denied' ? '❌ Denegados' : '⏳ Pendientes'}
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm font-medium">Sonido</p>
              <p className="text-xs text-muted-foreground">
                {soundEnabled ? '🔊 Habilitado' : '🔇 Deshabilitado'}
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm font-medium">Audio Init</p>
              <p className="text-xs text-muted-foreground">
                {audioInitialized ? '✅ Inicializado' : '⏳ Pendiente'}
              </p>
            </div>
          </div>

          {/* Botones de prueba */}
          <div className="space-y-3">
            {permission !== 'granted' && (
              <Button onClick={requestPermission} className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Solicitar Permisos de Notificación
              </Button>
            )}

            {soundEnabled && !audioInitialized && (
              <Button onClick={handleInitializeAudio} variant="outline" className="w-full">
                <Volume2 className="h-4 w-4 mr-2" />
                Inicializar Audio
              </Button>
            )}

            <Button 
              onClick={handleTestSound} 
              disabled={isTestingSound || !soundEnabled}
              variant="outline"
              className="w-full"
            >
              {isTestingSound ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Reproduciendo...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Probar Sonido
                </>
              )}
            </Button>

            <Button 
              onClick={handleTestNotification} 
              disabled={isTestingNotification || (!canShowNotifications && !soundEnabled)}
              className="w-full"
            >
              {isTestingNotification ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Probar Notificación
                </>
              )}
            </Button>
          </div>

          {/* Información de debug */}
          <div className="p-4 rounded-lg bg-muted text-sm">
            <p className="font-medium mb-2">Estado de Debug:</p>
            <pre className="text-xs overflow-auto">
{JSON.stringify({
  isSupported,
  permission,
  soundEnabled,
  notificationsEnabled,
  audioInitialized,
  canShowNotifications,
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
}, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
