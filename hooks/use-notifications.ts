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
      try {
        // Verificar soporte de notificaciones de manera segura
        const notificationsSupported = 'Notification' in window
        const serviceWorkerSupported = 'serviceWorker' in navigator
        setIsSupported(notificationsSupported && serviceWorkerSupported)
        
        // Solo acceder a Notification.permission si está disponible
        if (notificationsSupported) {
          setPermission(Notification.permission)
        }
        
        // Cargar preferencias del localStorage de manera segura
        try {
          const savedSoundEnabled = localStorage.getItem('notifications-sound-enabled')
          const savedNotificationsEnabled = localStorage.getItem('notifications-enabled')
          
          if (savedSoundEnabled !== null) {
            setSoundEnabled(JSON.parse(savedSoundEnabled))
          }
          if (savedNotificationsEnabled !== null) {
            setNotificationsEnabled(JSON.parse(savedNotificationsEnabled))
          }
        } catch (storageError) {
          console.warn('⚠️ [NOTIFICATIONS] Error accediendo a localStorage:', storageError)
        }
      } catch (error) {
        console.warn('⚠️ [NOTIFICATIONS] Error inicializando notificaciones:', error)
        setIsSupported(false)
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
      
      // Verificar si AudioContext está disponible
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      
      if (!AudioContextClass) {
        console.warn('⚠️ [NOTIFICATIONS] AudioContext no disponible en este navegador')
        toast({
          title: "Audio no disponible",
          description: "Tu navegador no soporta audio web. Las notificaciones funcionarán sin sonido.",
          variant: "destructive"
        })
        return false
      }
      
      // Crear AudioContext si no existe
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
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
      
      // Mostrar toast de éxito
      toast({
        title: "Audio activado",
        description: "Los sonidos de notificación están listos",
      })
      
      return true
    } catch (error) {
      console.warn('❌ [NOTIFICATIONS] Error inicializando sonidos:', error)
      toast({
        title: "Error al inicializar audio",
        description: "Tu navegador no soporta audio web. Las notificaciones funcionarán sin sonido.",
        variant: "destructive"
      })
      return false
    }
  }, [audioInitialized, toast])

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
      // Verificar que Notification esté disponible
      if (typeof Notification === 'undefined') {
        console.warn('⚠️ [NOTIFICATIONS] Notification API no disponible')
        toast({
          title: "No disponible",
          description: "Las notificaciones no están disponibles en este navegador",
          variant: "destructive"
        })
        return false
      }

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
      console.error('❌ [NOTIFICATIONS] Error solicitando permisos:', error)
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
    // IMPORTANTE: Reproducir sonido SIEMPRE si está habilitado, independientemente de las notificaciones
    if (soundEnabled) {
      console.log('🔊 [NOTIFICATIONS] Reproduciendo sonido para notificación')
      await playSound('message')
    }

    // Si las notificaciones están deshabilitadas, solo se reproduce el sonido
    if (!notificationsEnabled) {
      console.log('🔕 [NOTIFICATIONS] Notificaciones deshabilitadas, solo se reprodujo el sonido')
      return
    }

    // Si no hay permisos, mostrar solo toast
    if (permission !== 'granted') {
      console.log('⚠️ [NOTIFICATIONS] Sin permisos, mostrando toast')
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
        silent: true, // Silenciar notificación del sistema porque ya reproducimos nuestro sonido
        ...options
      }

      console.log('🔔 [NOTIFICATIONS] Mostrando notificación del sistema')
      
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
      console.error('❌ [NOTIFICATIONS] Error mostrando notificación:', error)
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
    try {
      const newValue = !soundEnabled
      setSoundEnabled(newValue)
      
      try {
        localStorage.setItem('notifications-sound-enabled', JSON.stringify(newValue))
      } catch (storageError) {
        console.warn('⚠️ [NOTIFICATIONS] Error guardando en localStorage:', storageError)
      }
      
      if (newValue && !audioInitialized) {
        // Intentar inicializar el audio automáticamente cuando se habilite el sonido
        try {
          const initialized = await initializeSounds()
          if (initialized) {
            // Reproducir sonido de prueba si se inicializó correctamente
            await playSound('message')
            console.log('✅ [NOTIFICATIONS] Audio inicializado automáticamente al activar sonido')
          }
        } catch (error) {
          console.log('🔊 [NOTIFICATIONS] Audio no se pudo inicializar automáticamente, requerirá interacción manual')
        }
      } else if (newValue && audioInitialized) {
        // Si ya está inicializado, solo reproducir sonido de prueba
        try {
          await playSound('message')
        } catch (error) {
          console.warn('⚠️ [NOTIFICATIONS] Error reproduciendo sonido de prueba:', error)
        }
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error en toggleSound:', error)
    }
  }, [soundEnabled, audioInitialized, playSound, initializeSounds])

  const toggleNotifications = useCallback(() => {
    try {
      const newValue = !notificationsEnabled
      setNotificationsEnabled(newValue)
      
      try {
        localStorage.setItem('notifications-enabled', JSON.stringify(newValue))
      } catch (storageError) {
        console.warn('⚠️ [NOTIFICATIONS] Error guardando en localStorage:', storageError)
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error en toggleNotifications:', error)
    }
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
