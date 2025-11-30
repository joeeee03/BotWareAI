// Componente para registrar el service worker
"use client"

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar el service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration)
          
          // Verificar si hay actualizaciones
          registration.addEventListener('updatefound', () => {
            console.log('[SW] New service worker found, installing...')
            const newWorker = registration.installing
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New service worker installed, ready to activate')
                  // Aquí podrías mostrar una notificación al usuario sobre la actualización
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error)
        })

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data)
      })

      // Manejar actualizaciones del service worker
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        console.log('[SW] Controller changed, reloading page...')
        window.location.reload()
      })
    }
  }, [])

  return null // Este componente no renderiza nada
}

export default ServiceWorkerRegister
