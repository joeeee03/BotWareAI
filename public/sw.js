// Service Worker para notificaciones push
// Este archivo maneja las notificaciones cuando la aplicación está cerrada

const CACHE_NAME = 'chatmessages-v1'
const urlsToCache = [
  '/',
  '/favicon.ico',
  // Agregar otros recursos estáticos si es necesario
]

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Activar el service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Manejar requests (opcional - para cache offline)
self.addEventListener('fetch', (event) => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') return
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde cache si existe, sino hacer fetch
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})

// Manejar notificaciones push (cuando la app está cerrada)
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received:', event)
  
  let notificationData = {
    title: 'Nuevo mensaje',
    body: 'Tienes un nuevo mensaje',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'message-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir chat'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  }
  
  // Si hay datos en el push, usarlos
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (e) {
      console.log('[SW] Error parsing push data:', e)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  )
})

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event)
  
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  // Abrir o enfocar la aplicación
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event)
  // Aquí podrías enviar analytics o hacer cleanup si es necesario
})

console.log('[SW] Service worker loaded successfully')
