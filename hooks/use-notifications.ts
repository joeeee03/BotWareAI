// Hook para manejar notificaciones push y sonidos
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from './use-toast'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
}

interface NotificationSound {
  message: string
  notification: string
  call: string
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const { toast } = useToast()
  
  // Referencias para los sonidos
  const soundsRef = useRef<NotificationSound | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Inicializar soporte y permisos
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator)
      setPermission(Notification.permission)
      
      // Cargar preferencias del localStorage
      const savedSoundEnabled = localStorage.getItem('notifications-sound-enabled')
      const savedNotificationsEnabled = localStorage.getItem('notifications-enabled')
      
      if (savedSoundEnabled !== null) {
        setSoundEnabled(JSON.parse(savedSoundEnabled))
      }
      if (savedNotificationsEnabled !== null) {
        setNotificationsEnabled(JSON.parse(savedNotificationsEnabled))
      }
    }
  }, [])

  // Inicializar sonidos cuando sea necesario (no automáticamente)
  useEffect(() => {
    if (typeof window !== 'undefined' && soundEnabled && !audioInitialized) {
      // No inicializar automáticamente - esperar a la primera interacción del usuario
      console.log('🔊 [NOTIFICATIONS] Audio habilitado, esperando interacción del usuario para inicializar')
    }
  }, [soundEnabled, audioInitialized])

  // Función para inicializar sonidos
  const initializeSounds = useCallback(async () => {
    if (audioInitialized) return true

    try {
      console.log('🔊 [NOTIFICATIONS] Inicializando AudioContext...')
      
      // Crear AudioContext si no existe
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current
      
      // Reanudar el contexto si está suspendido (requerido por navegadores modernos)
      if (audioContext.state === 'suspended') {
        console.log('🔊 [NOTIFICATIONS] Reanudando AudioContext suspendido...')
        await audioContext.resume()
      }

      // Definir sonidos usando frecuencias (no requiere archivos externos)
      soundsRef.current = {
        message: 'message', // Sonido para mensajes normales
        notification: 'notification', // Sonido para notificaciones importantes
        call: 'call' // Sonido para llamadas (futuro)
      }

      setAudioInitialized(true)
      console.log('✅ [NOTIFICATIONS] AudioContext inicializado correctamente')
      return true
    } catch (error) {
      console.warn('❌ [NOTIFICATIONS] Error inicializando sonidos:', error)
      return false
    }
  }, [audioInitialized])

  // Función para generar y reproducir sonido usando Web Audio API
  const playSound = useCallback(async (type: keyof NotificationSound = 'message') => {
    if (!soundEnabled) {
      console.log('🔇 [NOTIFICATIONS] Sonido deshabilitado')
      return
    }

    // Inicializar audio si no está inicializado
    if (!audioInitialized) {
      console.log('🔊 [NOTIFICATIONS] Inicializando audio antes de reproducir sonido...')
      const initialized = await initializeSounds()
      if (!initialized) {
        console.warn('❌ [NOTIFICATIONS] No se pudo inicializar el audio')
        return
      }
    }

    if (!audioContextRef.current) {
      console.warn('❌ [NOTIFICATIONS] AudioContext no disponible')
      return
    }

    try {
      const audioContext = audioContextRef.current
      
      // Reanudar el contexto si está suspendido
      if (audioContext.state === 'suspended') {
        console.log('🔊 [NOTIFICATIONS] Reanudando AudioContext...')
        await audioContext.resume()
      }

      // Configuraciones de sonido según el tipo
      const soundConfigs = {
        message: { frequency: 800, duration: 0.2, volume: 0.3 },
        notification: { frequency: 600, duration: 0.4, volume: 0.4 },
        call: { frequency: 440, duration: 1.0, volume: 0.5 }
      }

      const config = soundConfigs[type]
      
      // Crear oscilador
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      // Conectar nodos
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Configurar sonido
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      // Configurar volumen con fade in/out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(config.volume, audioContext.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration)
      
      // Reproducir
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + config.duration)
      
      console.log(`🔊 [NOTIFICATIONS] Sonido ${type} reproducido correctamente`)
      
    } catch (error) {
      console.warn('❌ [NOTIFICATIONS] Error reproduciendo sonido:', error)
    }
  }, [soundEnabled, audioInitialized, initializeSounds])

  // Solicitar permisos de notificación
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta notificaciones push",
        variant: "destructive"
      })
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        toast({
          title: "¡Perfecto!",
          description: "Notificaciones habilitadas correctamente",
        })
        return true
      } else if (result === 'denied') {
        toast({
          title: "Permisos denegados",
          description: "Para recibir notificaciones, habilítalas en la configuración del navegador",
          variant: "destructive"
        })
        return false
      }
      return false
    } catch (error) {
      console.error('Error solicitando permisos:', error)
      toast({
        title: "Error",
        description: "No se pudieron solicitar los permisos de notificación",
        variant: "destructive"
      })
      return false
    }
  }, [isSupported, toast])

  // Mostrar notificación
  const showNotification = useCallback(async (options: NotificationOptions) => {
    if (!notificationsEnabled) return

    // Reproducir sonido primero
    if (soundEnabled) {
      await playSound('message')
    }

    // Si no hay permisos, mostrar solo toast
    if (permission !== 'granted') {
      toast({
        title: options.title,
        description: options.body,
      })
      return
    }

    try {
      // Configuración por defecto
      const notificationOptions: NotificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: !soundEnabled, // Si el sonido está deshabilitado, usar silent
        ...options
      }

      // Crear notificación
      const notification = new Notification(options.title, notificationOptions)
      
      // Auto-cerrar después de 5 segundos si no requiere interacción
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Manejar click en la notificación
      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Si hay datos adicionales, manejarlos
        if (options.data?.conversationId) {
          // Aquí podrías navegar a la conversación específica
          console.log('Navegando a conversación:', options.data.conversationId)
        }
      }

    } catch (error) {
      console.error('Error mostrando notificación:', error)
      // Fallback a toast
      toast({
        title: options.title,
        description: options.body,
      })
    }
  }, [permission, notificationsEnabled, soundEnabled, playSound, toast])

  // Función específica para notificar nuevos mensajes
  const notifyNewMessage = useCallback(async (senderName: string, message: string, conversationId?: number) => {
    await showNotification({
      title: `💬 ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: `message-${conversationId}`, // Evita duplicados
      data: { conversationId, type: 'message' },
      requireInteraction: false
    })
  }, [showNotification])

  // Función para notificar eventos importantes
  const notifyImportant = useCallback(async (title: string, message: string) => {
    if (soundEnabled) {
      await playSound('notification')
    }
    
    await showNotification({
      title: `⚠️ ${title}`,
      body: message,
      requireInteraction: true,
      data: { type: 'important' }
    })
  }, [showNotification, soundEnabled, playSound])

  // Funciones para cambiar configuración
  const toggleSound = useCallback(async () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('notifications-sound-enabled', JSON.stringify(newValue))
    
    if (newValue) {
      // Intentar inicializar el audio automáticamente cuando se habilite el sonido
      try {
        await initializeSounds()
        // Reproducir sonido de prueba si se inicializó correctamente
        await playSound('message')
      } catch (error) {
        console.log('🔊 [NOTIFICATIONS] Audio no se pudo inicializar automáticamente, requerirá interacción manual')
      }
    }
  }, [soundEnabled, playSound, initializeSounds])

  const toggleNotifications = useCallback(() => {
    const newValue = !notificationsEnabled
    setNotificationsEnabled(newValue)
    localStorage.setItem('notifications-enabled', JSON.stringify(newValue))
  }, [notificationsEnabled])

  // Test de notificación
  const testNotification = useCallback(async () => {
    await notifyNewMessage('Sistema de Prueba', '¡Las notificaciones están funcionando correctamente! 🎉')
  }, [notifyNewMessage])

  return {
    // Estado
    isSupported,
    permission,
    soundEnabled,
    notificationsEnabled,
    audioInitialized,
    
    // Funciones principales
    requestPermission,
    showNotification,
    notifyNewMessage,
    notifyImportant,
    playSound,
    initializeSounds,
    
    // Configuración
    toggleSound,
    toggleNotifications,
    testNotification,
    
    // Helpers
    canShowNotifications: permission === 'granted' && notificationsEnabled,
    needsPermission: permission === 'default' && isSupported
  }
}
