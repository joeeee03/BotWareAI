# 🏗️ Arquitectura en Railway - Single Port con Next.js Rewrites

## 🚨 PROBLEMA QUE SE ARREGLÓ

### ❌ Antes (NO funcionaba)
```
Cliente → https://tu-app.railway.app:3001/api/...  ❌ Puerto 3001 NO expuesto
Cliente → wss://tu-app.railway.app:3001/socket.io  ❌ Puerto 3001 NO expuesto
```

**Railway solo expone 1 puerto** (el de la variable `PORT`), NO puedes conectar a `:3001` desde fuera.

### ✅ Ahora (SÍ funciona)
```
Cliente → https://tu-app.railway.app/api/...
          ↓ (Next.js rewrite)
          → http://localhost:3001/api/...  ✅ Backend interno

Cliente → wss://tu-app.railway.app/socket.io
          ↓ (Next.js rewrite)
          → ws://localhost:3001/socket.io  ✅ Backend interno
```

---

## 📐 Arquitectura

```
┌─────────────────────────────────────────────────┐
│  RAILWAY (Solo expone 1 puerto: process.env.PORT)│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Next.js Frontend (PORT variable)       │  │
│  │  - Sirve la UI                           │  │
│  │  - Hace REWRITE de /api/* y /socket.io/*│  │
│  └──────────────────────────────────────────┘  │
│                    ↓ rewrite interno             │
│  ┌──────────────────────────────────────────┐  │
│  │  Backend Express (puerto 3001 interno)   │  │
│  │  - Solo accesible internamente           │  │
│  │  - Socket.IO corre aquí                  │  │
│  │  - APIs REST aquí                        │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                             │
│  ┌──────────────────────────────────────────┐  │
│  │  PostgreSQL (URL de Railway)             │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Cómo Funciona

### 1. **Next.js Rewrites** (`next.config.mjs`)

```javascript
async rewrites() {
  const backendUrl = 'http://localhost:3001';
  return [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,  // Reescribe a backend interno
    },
    {
      source: '/socket.io/:path*',
      destination: `${backendUrl}/socket.io/:path*`,  // Reescribe WebSocket
    },
  ];
}
```

**Esto significa:**
- Cuando el cliente hace `fetch('/api/auth/login')` → Next.js lo reescribe a `http://localhost:3001/api/auth/login`
- Cuando Socket.IO conecta a `/socket.io` → Next.js lo reescribe a `ws://localhost:3001/socket.io`

---

### 2. **API Client** (`lib/api-client.ts`)

```typescript
// En Railway: usar rutas relativas
if (isProduction) {
  API_URL = ''  // ← Rutas relativas como /api/...
} else {
  // En local: conectar directo
  API_URL = 'http://localhost:3001'
}

// Llamadas:
fetch(`${API_URL}/api/auth/login`)
// Railway: fetch('/api/auth/login') → Next.js rewrite → backend
// Local: fetch('http://localhost:3001/api/auth/login') → directo
```

---

### 3. **Socket.IO Client** (`lib/socket-client.ts`)

```typescript
// En Railway: usar el mismo origen
if (isProduction) {
  socketUrl = window.location.origin  // ← https://tu-app.railway.app
} else {
  // En local: conectar directo
  socketUrl = 'http://localhost:3001'
}

io(socketUrl, {
  path: '/socket.io',  // ← Next.js reescribe esta ruta
})

// Railway: io('https://tu-app.railway.app', { path: '/socket.io' })
//          → Next.js rewrite → ws://localhost:3001/socket.io
// Local: io('http://localhost:3001', { path: '/socket.io' })
//        → Directo al backend
```

---

### 4. **server-combined.js** (Proceso combinado)

```javascript
// Arranca AMBOS servicios:
// 1. Backend en puerto 3001 (interno)
spawn('node', ['backend/dist/server.js'], {
  env: { PORT: '3001' }
});

// 2. Frontend en puerto asignado por Railway (externo)
spawn('node', ['server.js'], {
  env: { 
    PORT: process.env.PORT,  // Puerto público de Railway
    NEXT_PUBLIC_BACKEND_URL: 'http://localhost:3001'  // Para rewrites
  }
});
```

---

## 🎯 Flujo Completo

### Ejemplo: Login

```
1. Usuario abre: https://tu-app.railway.app

2. Click en Login → fetch('/api/auth/login', ...)
   
3. Next.js intercepta y reescribe:
   /api/auth/login → http://localhost:3001/api/auth/login
   
4. Backend (puerto 3001 interno) procesa y responde

5. Frontend recibe respuesta y guarda token

6. Socket.IO intenta conectar: io('https://tu-app.railway.app', { path: '/socket.io' })
   
7. Next.js reescribe:
   wss://tu-app.railway.app/socket.io → ws://localhost:3001/socket.io
   
8. Backend acepta WebSocket upgrade

9. ✅ Socket conectado, usuario ve "Conectado" arriba
```

---

### Ejemplo: Mensaje Nuevo

```
1. Webhook inserta mensaje en PostgreSQL

2. PostgreSQL trigger → NOTIFY new_message

3. Backend (puerto 3001) recibe notificación

4. Backend emite: io.to('conversation_7').emit('message:new', {...})

5. Socket.IO envía a través del WebSocket (que pasa por Next.js rewrite)

6. Cliente recibe evento 'message:new'

7. ✅ Mensaje aparece automáticamente en la UI
```

---

## 🔍 Debugging

### ✅ Verificar que los Rewrites Funcionan

**En Railway Logs al iniciar:**
```bash
[Next.js] Rewriting /api/* and /socket.io/* to: http://localhost:3001
```

**En la consola del navegador (F12):**
```bash
[API-CLIENT] RAILWAY MODE - Using Next.js rewrites (relative URLs)
🔌 [SOCKET] RAILWAY MODE - Using Next.js rewrite: https://tu-app.railway.app
🔌 [SOCKET] Path: /socket.io (Next.js will rewrite this)
```

---

### ❌ Si ves este error:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
https://tu-app.railway.app:3001/api/...
```

**Significa:** El código está intentando conectar a `:3001` directamente en vez de usar rewrites.

**Solución:** Verifica que `lib/api-client.ts` y `lib/socket-client.ts` detecten correctamente el modo producción.

---

### ❌ Si Socket.IO dice "Desconectado":
```bash
# En Railway logs, busca:
[v0] 🔐 Socket connection attempt from: ...
```

**Si NO ves esto:** Socket.IO NO está llegando al backend.

**Posibles causas:**
1. El rewrite de `/socket.io` no funciona
2. Next.js no arrancó correctamente
3. Variable `NEXT_PUBLIC_BACKEND_URL` no está configurada

**Solución:**
```bash
# En Railway, verifica env vars:
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## 📦 Variables de Entorno

### Railway
```env
# Backend
PORT=3001  # Puerto interno del backend (no expuesto)
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=tu-key-secreta
JWT_SECRET=tu-jwt-secret

# Frontend (Next.js)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001  # Para rewrites
```

### Local
```env
# Backend
PORT=3001
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=tu-key-secreta
JWT_SECRET=tu-jwt-secret

# Frontend (Next.js)
# No necesita NEXT_PUBLIC_BACKEND_URL, usa default
```

---

## ✅ Checklist Deploy Railway

Después de hacer push, espera 2-3 minutos y verifica:

- [ ] Railway desplegó correctamente
- [ ] Logs muestran: `[Next.js] Rewriting /api/* and /socket.io/* to: http://localhost:3001`
- [ ] Logs muestran: `✅ [REALTIME] Sistema en tiempo real ACTIVO`
- [ ] Logs muestran: `[SOCKET-HANDLER] 📊 Conexiones activas: X` (X > 0 después de login)
- [ ] En navegador (F12): `[API-CLIENT] RAILWAY MODE - Using Next.js rewrites`
- [ ] En navegador (F12): `🟢 [SOCKET] Connected: abc123`
- [ ] Login funciona correctamente
- [ ] Puedes ver tus conversaciones
- [ ] Los mensajes se cargan al abrir un chat
- [ ] Estado dice "Conectado" arriba a la derecha
- [ ] Cuando insertas un mensaje, aparece automáticamente

---

## 🎓 Resumen

**RAILWAY = 1 PUERTO EXPUESTO**

No puedes hacer:
- ❌ `fetch('https://tu-app:3001/api/...')`
- ❌ `io('wss://tu-app:3001')`

Debes hacer:
- ✅ `fetch('/api/...')` → Next.js rewrite → backend interno
- ✅ `io(window.location.origin, { path: '/socket.io' })` → Next.js rewrite → backend interno

**Esta arquitectura funciona porque:**
1. Todo pasa por el puerto público de Railway
2. Next.js actúa como proxy reverso
3. Backend corre internamente en puerto 3001
4. Nadie afuera puede acceder directamente a :3001
5. Todo el tráfico está enrutado correctamente

🚀 **¡Listo! Ahora sí funciona login, API calls y Socket.IO en Railway!**
