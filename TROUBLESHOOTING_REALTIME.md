# 🔍 TROUBLESHOOTING - Tiempo Real NO Funciona

## ⚠️ PASO A PASO PARA RESOLVER EL PROBLEMA

### 🎯 OBJETIVO
Hacer que los mensajes aparezcan automáticamente sin refrescar la página cuando otro proyecto inserta datos en la BD.

---

## 📋 CHECKLIST - Sigue Estos Pasos en Orden

### ✅ PASO 1: Verificar que el Polling Está Corriendo

**En Railway → Logs del Deploy:**

Busca este log cuando el servidor arranca:

```
[MESSAGE-POLLING] 🔄 Iniciando polling de mensajes...
[MESSAGE-POLLING] ⏱️  Intervalo: 1000 ms
[MESSAGE-POLLING] 📅 Timestamp inicial: 2025-11-16T...
[MESSAGE-POLLING] 🚀 Ejecutando primera consulta INMEDIATAMENTE...
[MESSAGE-POLLING] ✅ Polling iniciado exitosamente
```

**❌ SI NO VES ESTO:**
- El polling NO se inició
- Revisa que `server.ts` esté importando `message-polling.js` correctamente
- Verifica que no haya errores de TypeScript en el build

**✅ SI LO VES:**
- El polling SÍ está corriendo
- Continúa al Paso 2

---

### ✅ PASO 2: Verificar que el Polling Consulta la BD

**En Railway → Logs (cada 1 segundo deberías ver):**

```
[MESSAGE-POLLING] ⏰ Ejecutando polling programado...
[MESSAGE-POLLING] 🔍 Consultando mensajes desde: 2025-11-16T23:59:00.000Z
[MESSAGE-POLLING] 📊 Encontrados 0 mensajes nuevos
```

**❌ SI NO VES ESTO:**
- El intervalo no está ejecutándose
- Puede haber un error en la función `checkForNewMessages`
- Revisa los logs por errores SQL

**✅ SI LO VES PERO SIEMPRE DICE "Encontrados 0":**
- El polling SÍ funciona
- Pero NO está detectando mensajes nuevos
- **PRUEBA:** Inserta un mensaje de prueba y continúa al Paso 3

---

### ✅ PASO 3: Insertar Mensaje de Prueba

**Opción A: Desde tu otro proyecto**

```javascript
await pool.query(`
  INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
  VALUES ($1, $2, 'user', $3, NOW())
  RETURNING id, created_at
`, [conversationId, botId, 'TEST: Mensaje de prueba ' + Date.now()])
```

**Opción B: Desde Railway CLI**

```bash
# Conectar a PostgreSQL
railway connect postgres

# En psql:
INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
VALUES (1, 1, 'user', 'TEST: Mensaje de prueba desde psql', NOW());
```

**Opción C: Desde el endpoint de debug**

```bash
curl -X POST https://tu-app.railway.app/api/debug/test-message \
  -H "Content-Type: application/json" \
  -d '{"conversationId": 1, "message": "TEST desde debug"}'
```

---

### ✅ PASO 4: Verificar que el Polling Detectó el Mensaje

**Después de insertar, busca en Railway Logs:**

```
[MESSAGE-POLLING] 📊 Encontrados 1 mensajes nuevos
[MESSAGE-POLLING] 📨 Procesando mensaje ID: 456, sender: user
[MESSAGE-POLLING] 🔓 Mensaje desencriptado: "TEST: Mensaje de prueba..."
[MESSAGE-POLLING] ✅ Emitido message:new a conversation_1
[MESSAGE-POLLING] ✅ Emitido conversation:updated a user_1
[MESSAGE-POLLING] 📅 Timestamp actualizado a: 2025-11-16T23:59:30.000Z
```

**❌ SI NO VES "Encontrados 1 mensajes nuevos":**
- El mensaje NO se insertó correctamente
- O el `created_at` está en el pasado antes del `lastCheckedTimestamp`
- **SOLUCIÓN:** Verifica que el mensaje existe con:
  ```sql
  SELECT id, created_at FROM messages ORDER BY created_at DESC LIMIT 5;
  ```

**❌ SI VES "Encontrados 1" PERO NO VES "Emitido message:new":**
- Hay un error al desencriptar o procesar el mensaje
- Revisa los logs por errores de desencriptación
- Verifica que `ENCRYPTION_KEY` sea correcta

**✅ SI VES "Emitido message:new a conversation_X":**
- El backend SÍ detectó el mensaje
- El backend SÍ emitió el evento por Socket.IO
- Continúa al Paso 5

---

### ✅ PASO 5: Verificar que Socket.IO Tiene Conexiones

**En Railway → Logs (cada 10 segundos):**

```
[SOCKET-HANDLER] 📊 Conexiones activas: 1
[SOCKET-HANDLER]    Socket abc123xyz en rooms: user_1, conversation_5
```

**❌ SI DICE "Conexiones activas: 0":**
- NADIE está conectado al Socket.IO
- El frontend NO se conectó
- **CAUSA COMÚN:** Socket.IO no puede conectarse desde el frontend
- **SOLUCIÓN:** Continúa al Paso 6

**✅ SI VES "Conexiones activas: 1" o más:**
- Hay usuarios conectados
- Verifica que los rooms incluyan `user_X` y `conversation_X`
- Si los rooms están bien, continúa al Paso 6

---

### ✅ PASO 6: Verificar Conexión Socket.IO en el Frontend

**Abre tu app en el navegador → F12 → Consola**

Busca estos logs:

```
🔌 [SOCKET] Connecting to: https://tu-app.railway.app
🔌 [SOCKET] Hostname: tu-app.railway.app
🔌 [SOCKET] Is production: true
🟢 [SOCKET] Connected: abc123xyz
🟢 [SOCKET] Transport: websocket
```

**❌ SI NO VES "Connected":**
- Socket.IO NO se conectó
- **CAUSA 1:** La URL está mal (verifica `NEXT_PUBLIC_SOCKET_URL`)
- **CAUSA 2:** CORS está bloqueando (verifica `FRONTEND_URL` en Railway)
- **CAUSA 3:** El path `/socket.io` no está funcionando
- **SOLUCIÓN:** Revisa la configuración de `next.config.mjs` y `server.ts`

**❌ SI VE "Connection error":**
- Hay un error de conexión
- Lee el mensaje de error específico
- Común: "xhr poll error" = problema de red o CORS

**✅ SI VES "🟢 Connected":**
- Socket.IO SÍ está conectado
- Continúa al Paso 7

---

### ✅ PASO 7: Verificar que el Frontend Se Unió a Rooms

**En consola del navegador:**

```
🚪 [MESSAGE-THREAD] Joining conversation room: 5
```

**En Railway Logs (deberías ver):**

```
[SOCKET-HANDLER] 📥 User 1 joined conversation room: conversation_5
```

**❌ SI NO VES el log en Railway:**
- El evento `join:conversation` NO llegó al backend
- O el socket handler NO está configurado
- **SOLUCIÓN:** Verifica que `socket-handler.ts` esté importado en `server.ts`

**✅ SI VES el log:**
- El usuario SÍ se unió al room
- Continúa al Paso 8

---

### ✅ PASO 8: Probar Evento en Tiempo Real

**1. Inserta un mensaje de prueba (Paso 3)**

**2. En Railway Logs busca:**
```
[MESSAGE-POLLING] ✅ Emitido message:new a conversation_5
```

**3. En la consola del navegador busca:**
```
📨 [SOCKET] Event received: message:new [{"id":456,"message":"TEST..."}]
```

**❌ SI EL BACKEND EMITE PERO EL FRONTEND NO RECIBE:**
- **PROBLEMA:** El usuario NO está en el room correcto
- **SOLUCIÓN:** Verifica que el `conversationId` coincida
- Verifica en Railway logs: `Socket abc123 en rooms: conversation_5`
- Si el usuario está en `conversation_3` pero el mensaje se emite a `conversation_5`, NO lo recibirá

**❌ SI EL FRONTEND RECIBE PERO NO SE MUESTRA:**
- **PROBLEMA:** El handler de `message:new` NO está funcionando
- **SOLUCIÓN:** Revisa `useSocket` en `hooks/use-socket.ts`
- Verifica que el callback `onNewMessage` esté configurado
- Revisa `message-thread.tsx` para ver si actualiza el state

**✅ SI TODO FUNCIONA:**
- ¡El mensaje debería aparecer en la UI!
- Si no aparece, hay un problema en React state management

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Polling no detecta mensajes"

**Síntoma:**
```
[MESSAGE-POLLING] 📊 Encontrados 0 mensajes nuevos
```
Incluso después de insertar un mensaje.

**Causa:** El `created_at` del mensaje es anterior al `lastCheckedTimestamp`.

**Solución:**
```sql
-- Ver el timestamp del último mensaje
SELECT id, created_at FROM messages ORDER BY created_at DESC LIMIT 1;

-- Comparar con el timestamp en los logs
-- Si el mensaje es más antiguo, no será detectado
```

**Fix:** Inserta un mensaje con `NOW()` explícito:
```sql
INSERT INTO messages (..., created_at) VALUES (..., NOW());
```

---

### Problema 2: "Socket.IO no se conecta"

**Síntoma:**
```
❌ [SOCKET] Connection error: xhr poll error
```

**Causa:** Problema de CORS o path incorrecto.

**Solución 1 - Verificar CORS:**
```javascript
// En backend/server.ts
cors: {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
}
```

Verifica que `FRONTEND_URL` en Railway sea: `https://tu-app.railway.app`

**Solución 2 - Verificar Path:**
```javascript
// En lib/socket-client.ts
socket = io(socketUrl, {
  path: '/socket.io', // Debe estar
  ...
})
```

---

### Problema 3: "Frontend recibe evento pero no actualiza"

**Síntoma:**
```
📨 [SOCKET] Event received: message:new [...]
```
Pero el mensaje NO aparece en la UI.

**Causa:** El state de React no se actualiza.

**Solución - Verificar callback:**
```typescript
// En message-thread.tsx
useSocket({
  token,
  conversationId: conversation.id.toString(),
  onNewMessage: (message) => {
    console.log('✅ [MESSAGE-THREAD] Adding message to current conversation')
    setMessages((prev) => [...prev, message]) // Esto debe ejecutarse
    scrollToBottom()
  },
  ...
})
```

---

### Problema 4: "Mensajes duplicados"

**Síntoma:** El mismo mensaje aparece varias veces.

**Causa:** El polling encuentra el mismo mensaje múltiples veces.

**Solución:** Verificar que `lastCheckedTimestamp` se actualiza:
```
[MESSAGE-POLLING] 📅 Timestamp actualizado a: 2025-11-16T23:59:30.000Z
```

Si no ves este log, el timestamp NO se está actualizando.

---

## 🎯 RESUMEN - QUÉ LOGS VER

### Logs de Railway (Backend):

1. **Al iniciar:**
   - `[MESSAGE-POLLING] ✅ Polling iniciado exitosamente`

2. **Cada segundo:**
   - `[MESSAGE-POLLING] 🔍 Consultando mensajes desde:`

3. **Cuando llega un mensaje:**
   - `[MESSAGE-POLLING] 📊 Encontrados 1 mensajes nuevos`
   - `[MESSAGE-POLLING] ✅ Emitido message:new a conversation_X`

4. **Cada 10 segundos:**
   - `[SOCKET-HANDLER] 📊 Conexiones activas: X`

### Logs del Navegador (Frontend):

1. **Al cargar la página:**
   - `🟢 [SOCKET] Connected: abc123`

2. **Al abrir un chat:**
   - `🚪 [MESSAGE-THREAD] Joining conversation room: X`

3. **Cuando llega un mensaje:**
   - `📨 [SOCKET] Event received: message:new`

---

## 🛠️ COMANDOS ÚTILES

### Ver mensajes recientes:
```bash
curl https://tu-app.railway.app/api/debug/recent-messages
```

### Insertar mensaje de prueba:
```bash
curl -X POST https://tu-app.railway.app/api/debug/test-message \
  -H "Content-Type: application/json" \
  -d '{"conversationId": 1, "message": "TEST"}'
```

### Conectar a Railway PostgreSQL:
```bash
railway connect postgres
```

---

**Si sigues TODOS estos pasos y aún no funciona, comparte los logs específicos de cada paso para identificar dónde falla.** 🔍
