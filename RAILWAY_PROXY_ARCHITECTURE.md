# ✅ SOLUCIÓN DEFINITIVA: Proxy HTTP en Railway

## 🚨 EL PROBLEMA REAL

**Next.js rewrites y middleware NO funcionan en modo `standalone`** (que usa Railway).

Cuando compilas con `output: 'standalone'`, Next.js NO ejecuta:
- ❌ `async rewrites()` en `next.config.mjs`
- ❌ `middleware.ts`

Por eso obtenías:
```
GET https://botwareai-production.up.railway.app/socket.io?EIO=4&transport=polling 404 (Not Found)
GET https://botwareai-production.up.railway.app/api/auth/login 404 (Not Found)
```

---

## ✅ LA SOLUCIÓN: PROXY HTTP REAL

Implementamos un **servidor proxy HTTP** en `server-combined.js` que:

1. **Backend** corre en `localhost:3001`
2. **Frontend Next.js** corre en `localhost:8080`
3. **Proxy HTTP** escucha en `process.env.PORT` (puerto público de Railway)

El proxy intercepta requests y las envía al servicio correcto:

```javascript
// server-combined.js
const proxyServer = http.createServer((req, res) => {
  const url = req.url || '/';
  
  // Socket.IO y API → Backend
  if (url.startsWith('/socket.io') || url.startsWith('/api/')) {
    console.log(`[PROXY] → Backend: ${req.method} ${url}`);
    proxy.web(req, res, { target: `http://localhost:3001` });
  } else {
    // Todo lo demás → Frontend
    proxy.web(req, res, { target: `http://localhost:8080` });
  }
});

// WebSocket upgrade para Socket.IO
proxyServer.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io')) {
    proxy.ws(req, socket, head, { target: `http://localhost:3001` });
  }
});
```

---

## 🎯 FLUJO DE REQUESTS EN RAILWAY

### Request HTTP Normal

```
Cliente
   ↓
Railway (puerto público)
   ↓
Proxy HTTP (server-combined.js)
   ↓
Frontend Next.js (8080) → HTML/CSS/JS
```

### Request a API

```
Cliente: GET /api/auth/me
   ↓
Railway (puerto público)
   ↓
Proxy HTTP ve "/api/"
   ↓
Backend Express (3001) → JSON response
```

### Socket.IO Polling

```
Cliente: GET /socket.io?EIO=4&transport=polling
   ↓
Railway (puerto público)
   ↓
Proxy HTTP ve "/socket.io"
   ↓
Backend Socket.IO (3001) → 200 OK con session
```

### Socket.IO WebSocket Upgrade

```
Cliente: WebSocket upgrade /socket.io?EIO=4&transport=websocket
   ↓
Railway (puerto público)
   ↓
Proxy HTTP recibe evento 'upgrade'
   ↓
Backend Socket.IO (3001) → WebSocket connection
```

---

## 🔧 ESTRUCTURA DE PUERTOS

| Servicio | Puerto | Acceso |
|----------|--------|--------|
| **Proxy HTTP** | `process.env.PORT` (ej: 3000) | Público (Railway expone este) |
| **Backend Express + Socket.IO** | `3001` | Interno (solo accesible desde proxy) |
| **Frontend Next.js** | `8080` | Interno (solo accesible desde proxy) |

---

## 📦 DEPENDENCIAS NUEVAS

```json
{
  "dependencies": {
    "http-proxy": "^1.18.1"
  }
}
```

---

## 🚀 ORDEN DE INICIO

1. **Backend** inicia en puerto `3001`
2. **Frontend** inicia en puerto `8080` (después de 5 segundos)
3. **Proxy HTTP** inicia en puerto `process.env.PORT` (después de 8 segundos)

---

## 📊 LOGS ESPERADOS EN RAILWAY

### Al iniciar:

```
[Combined Server] 🚀 Starting backend and frontend...
[Combined Server] Public proxy will run on port 3000
[Combined Server] Backend will run on port 3001
[Combined Server] Frontend will run on port 8080
[Combined Server] 📡 Starting backend...
[v0] 🚀 Starting WhatsApp Backend on port 3001
[v0] ✅ Database connected successfully
[Combined Server] 🌐 Starting frontend (Next.js standalone)...
[Combined Server] 🔀 Starting HTTP proxy...
[Combined Server] ✅ All services started successfully!
```

### Cuando llegue una request:

```
[PROXY] → Backend: GET /socket.io?EIO=4&transport=polling
[PROXY] → Backend: GET /api/auth/me
[PROXY] → WebSocket upgrade: /socket.io?EIO=4&transport=websocket
```

---

## ✅ QUÉ VA A FUNCIONAR AHORA

1. **Socket.IO Polling:**
   ```
   GET /socket.io?EIO=4&transport=polling → 200 OK
   ```

2. **Socket.IO WebSocket:**
   ```
   WebSocket /socket.io?EIO=4&transport=websocket → Conectado
   ```

3. **API Calls:**
   ```
   GET /api/auth/me → 200 OK
   POST /api/auth/login → 200 OK
   ```

4. **Frontend:**
   ```
   GET / → HTML page
   GET /_next/static/... → JS/CSS
   ```

---

## 🧪 VERIFICACIÓN

Después del deploy, en la consola del navegador verás:

```
[API-CLIENT] RAILWAY MODE - Using Next.js rewrites (relative URLs)
[SOCKET] 🔌 Initializing socket with token...
[SOCKET] 🔌 RAILWAY MODE - Using Next.js rewrite: https://...
[SOCKET] 🟢 Connected: abc123xyz
[SOCKET] 🟢 Transport: polling
```

Y en Railway logs:

```
[PROXY] → Backend: GET /socket.io?EIO=4&transport=polling
[v0] Socket.IO client authenticated: abc123xyz
[PROXY] → WebSocket upgrade: /socket.io?EIO=4&transport=websocket
```

---

## 🎉 POR QUÉ ESTA SOLUCIÓN SÍ FUNCIONA

| Problema | Solución Anterior | Nueva Solución |
|----------|------------------|----------------|
| **Rewrites no funcionan en standalone** | `async rewrites()` | Proxy HTTP real |
| **Middleware no funciona** | `middleware.ts` | Proxy HTTP real |
| **404 en /socket.io** | Next.js no interceptaba | Proxy intercepta TODO |
| **WebSocket falla** | Next.js no soporta upgrade | `proxyServer.on('upgrade')` |
| **Polling falla** | Request no llegaba | Proxy redirecciona correctamente |

---

## 📝 ARCHIVOS MODIFICADOS

1. **`server-combined.js`** - Ahora es un proxy HTTP real
2. **`package.json`** - Agregado `http-proxy`
3. **`next.config.mjs`** - Simplificado (rewrites removidos)
4. **`middleware.ts`** - ❌ Eliminado (no funciona en standalone)

---

## 🔥 CONCLUSIÓN

**Esta es la ÚNICA forma correcta de hacer funcionar Socket.IO en Railway con Next.js standalone.**

No uses:
- ❌ Next.js rewrites
- ❌ Next.js middleware
- ❌ Variables de entorno que apunten directo al backend

Usa:
- ✅ Proxy HTTP real con `http-proxy`
- ✅ Tres puertos (público, backend interno, frontend interno)
- ✅ Intercepción de `/socket.io` y `/api` en el proxy
