# 🔍 GUÍA DE DEBUG - Railway Deploy

## ✅ ARREGLOS APLICADOS

### 1. **Socket.IO Conexión en Railway**
- ✅ Frontend conecta directamente a `https://tu-dominio.railway.app:3001`
- ✅ CORS permite todos los dominios `.railway.app`
- ✅ Logging extremo para ver intentos de conexión

### 2. **CORS Completo**
- ✅ Express CORS permite Railway
- ✅ Socket.IO CORS permite Railway
- ✅ Soporta múltiples puertos en el mismo dominio

### 3. **Logging Detallado**
- ✅ Autenticación Socket.IO con detalles
- ✅ Carga de mensajes con contadores
- ✅ Eventos emitidos con destinos

---

## 📋 LOGS QUE DEBES VER EN RAILWAY (Paso a Paso)

### ✅ PASO 1: Al Iniciar el Servidor

```bash
[v0] Starting server initialization...
[v0] Express and HTTP server created
[v0] Socket.IO configured
[v0] Socket authenticated for user: X
[v0] ✅ Server running on port 3001
[TRIGGERS] ✅ Triggers ya existen, no es necesario crearlos
[v0] ✅ Triggers configurados
✅ [REALTIME] Conectado a PostgreSQL NOTIFY
🎯 [REALTIME] Sistema PROFESIONAL: detección INSTANTÁNEA de cambios
👂 [REALTIME] Escuchando canal: new_message
👂 [REALTIME] Escuchando canal: new_conversation
🚀 [REALTIME] Sistema en tiempo real ACTIVO y esperando notificaciones...
```

**✅ SI VES ESTO = Backend arrancó correctamente**

---

### ✅ PASO 2: Al Abrir la App en el Navegador

**En Railway Logs deberías ver:**

```bash
[v0] 🔐 Socket connection attempt from: ::ffff:10.x.x.x
[v0] 🔐 Origin: https://tu-dominio.railway.app
[v0] Socket.IO - Allowing Railway origin: https://tu-dominio.railway.app
[v0] 🔑 Token received (first 20 chars): eyJhbGciOiJIUzI1NiIs...
[v0] ✅ Socket authenticated for user: 4
[v0] ✅ Socket ID: abc123xyz
[SOCKET-HANDLER] 🟢 User 4 connected with socket ID: abc123xyz
[SOCKET-HANDLER] ✅ User 4 joined room: user_4
[SOCKET-HANDLER] 🎯 Este usuario recibirá eventos en: user_4
```

**✅ SI VES ESTO = Socket.IO conectó exitosamente**

**❌ SI NO VES ESTO:**
1. Abre la consola del navegador (F12)
2. Busca mensajes de Socket.IO
3. Copia y pega los logs aquí

---

### ✅ PASO 3: Al Hacer Login

**En Railway Logs:**

```bash
[AUTH] Login attempt for username: tu_usuario
[AUTH] User authenticated: tu_usuario (ID: 4)
[AUTH] Token generated for user 4
```

**En la Consola del Navegador (F12):**

```bash
🔌 [SOCKET] RAILWAY MODE - Connecting to backend: https://tu-dominio.railway.app:3001
🔌 [SOCKET] Final socket URL: https://tu-dominio.railway.app:3001
🔌 [SOCKET] Hostname: tu-dominio.railway.app
🔌 [SOCKET] Token length: 200
🟢 [SOCKET] Connected: abc123xyz
🟢 [SOCKET] Transport: websocket
```

**✅ SI VES "🟢 Connected" = El frontend SÍ se conectó al Socket.IO**

**❌ SI VES "❌ Connection error":**
- Copia el mensaje de error exacto
- Pégalo aquí para debug

---

### ✅ PASO 4: Al Abrir una Conversación

**En Railway Logs:**

```bash
[MESSAGES] 📨 Loading messages for conversation 7, user 4
[MESSAGES] 📊 Limit: 50, Cursor: none
[MESSAGES] 📊 Found 15 messages in DB
[MESSAGES] 🔓 Decrypted 15 messages
[MESSAGES] ✅ Sending messages to frontend
```

**Y también:**

```bash
[SOCKET-HANDLER] 📥 User 4 joined conversation room: conversation_7
```

**En la Consola del Navegador:**

```bash
[DEBUG] Joining conversation: 7
📨 [SOCKET] Event received: conversation:joined [{"conversationId":"7"}]
```

**✅ SI VES ESTO = Los mensajes se están cargando Y el usuario se unió al room**

**❌ SI NO VES "[MESSAGES] 📨 Loading messages":**
- La ruta de mensajes NO se está llamando
- Problema en el frontend al hacer fetch

**❌ SI VES "Found 0 messages" pero sabes que hay mensajes:**
- Problema de permisos o ownership check
- El usuario no tiene acceso a esa conversación

---

### ✅ PASO 5: Al Recibir un Mensaje Nuevo

**Cuando tu otro proyecto inserta un mensaje:**

```sql
INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
VALUES (7, 1, 'user', 'Hola desde webhook', NOW());
```

**En Railway Logs (INSTANTÁNEAMENTE):**

```bash
📬 [REALTIME] Nueva notificación de mensaje: 268
📨 [REALTIME] Mensaje detectado - ID: 268, sender: user
🔍 [REALTIME] Message from DB: jmiJOwj9CmBwMBiAjw3Jfw==...
🔓 [REALTIME] Decrypted text: Hola desde webhook
📤 [REALTIME] Emitiendo message:new a room: conversation_7
📊 [REALTIME] Sockets conectados en conversation_7: 1
📤 [REALTIME] Emitiendo conversation:updated a room: user_4
📊 [REALTIME] Sockets conectados en user_4: 1
✅ [REALTIME] Eventos emitidos exitosamente para mensaje: 268
```

**En la Consola del Navegador:**

```bash
📨 [SOCKET] Event received: message:new [{"id":268,"message":"Hola desde webhook",...}]
✅ [MESSAGE-THREAD] Adding message to current conversation
📜 [SCROLL] Scrolling to bottom
```

**✅ SI VES TODO ESTO = ¡EL MENSAJE APARECE EN LA UI AUTOMÁTICAMENTE!**

**❌ SI VES "Sockets conectados en conversation_7: 0":**
- NADIE está viendo esa conversación
- Normal si la conversación está cerrada
- El mensaje se guarda, pero no se muestra hasta que abras el chat

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Desconectado" en la UI

**Síntoma:**
El estado de conexión siempre dice "Desconectado" arriba a la derecha.

**Causa:**
Socket.IO no está conectado.

**Verifica en Railway Logs:**
```bash
# Busca esto cada 10 segundos:
[SOCKET-HANDLER] 📊 Conexiones activas: 0
```

**Si es 0:**
1. Abre F12 en el navegador
2. Busca errores de Socket.IO
3. Verifica que veas: `🟢 [SOCKET] Connected`

**Si NO ves "Connected" en el navegador:**
- Error de CORS
- Error de autenticación (token inválido)
- URL incorrecta

**Logs a revisar:**
```bash
# En Railway, busca:
[v0] ❌ Socket connection rejected: [razón]
```

---

### Problema 2: Los mensajes NO se cargan al abrir un chat

**Síntoma:**
Abres una conversación y no aparecen los mensajes, pantalla en blanco.

**Verifica en Railway Logs:**
```bash
# Deberías ver:
[MESSAGES] 📨 Loading messages for conversation X
[MESSAGES] 📊 Found Y messages in DB
```

**Si NO ves "[MESSAGES] 📨":**
- La ruta `/api/conversations/:id/messages` NO se está llamando
- Problema en el frontend (fetch fallando)
- Token expirado o inválido

**Si ves "Found 0 messages" pero sabes que hay mensajes:**
```bash
# Verifica en la BD:
SELECT id, conversation_id, sender, message, created_at 
FROM messages 
WHERE conversation_id = 7 
ORDER BY created_at ASC;
```

**Si hay mensajes en la BD pero la API dice 0:**
- Problema de ownership check
- El bot no pertenece al usuario
- Verifica que `b.user_id = X` sea correcto

---

### Problema 3: Mensajes nuevos NO aparecen automáticamente

**Síntoma:**
Insertas un mensaje desde tu otro proyecto, pero NO aparece en la UI.

**Verifica PASO A PASO:**

**1. El trigger se ejecutó:**
```bash
# En Railway logs:
📬 [REALTIME] Nueva notificación de mensaje: 268
```

**❌ SI NO VES ESTO:**
- El trigger NO existe o NO funciona
- Ejecuta en Railway CLI:
  ```bash
  railway connect postgres
  # En psql:
  SELECT trigger_name FROM information_schema.triggers 
  WHERE trigger_name = 'trigger_notify_new_message';
  ```
- Si no existe, reinicia el servidor para que se cree

**2. El mensaje se desencriptó:**
```bash
🔓 [REALTIME] Decrypted text: Hola desde webhook
```

**❌ SI VES ERROR DE DESENCRIPTACIÓN:**
- La `ENCRYPTION_KEY` es diferente
- El mensaje se encriptó con otra clave
- **SOLUCIÓN:** Usa la MISMA clave en todos los proyectos

**3. El evento se emitió:**
```bash
📤 [REALTIME] Emitiendo message:new a room: conversation_7
📊 [REALTIME] Sockets conectados en conversation_7: 1
```

**❌ SI DICE "Sockets conectados: 0":**
- Nadie está viendo esa conversación
- El usuario no se unió al room
- **SOLUCIÓN:** Abre la conversación en la UI primero

**4. El frontend recibió el evento:**
```bash
# En consola del navegador:
📨 [SOCKET] Event received: message:new [...]
```

**❌ SI NO VES ESTO:**
- El evento se emitió pero el frontend no lo recibió
- El usuario NO está en el room correcto
- Verifica que los IDs coincidan

---

## 🎯 CHECKLIST RÁPIDO

Usa este checklist para verificar que TODO funcione:

- [ ] **Servidor arrancó:**
  - `✅ [REALTIME] Sistema en tiempo real ACTIVO`
  
- [ ] **Socket.IO conectó:**
  - `[v0] ✅ Socket authenticated for user: X`
  - `[SOCKET-HANDLER] 📊 Conexiones activas: 1` (o más)
  
- [ ] **Frontend conectó:**
  - En F12: `🟢 [SOCKET] Connected: abc123`
  
- [ ] **Usuario se unió a room:**
  - `[SOCKET-HANDLER] 📥 User X joined conversation room`
  
- [ ] **Mensajes se cargan:**
  - `[MESSAGES] 📊 Found X messages in DB`
  
- [ ] **Trigger funciona:**
  - Inserta mensaje → `📬 [REALTIME] Nueva notificación`
  
- [ ] **Evento se emite:**
  - `📤 [REALTIME] Emitiendo message:new`
  - `📊 [REALTIME] Sockets conectados: 1`
  
- [ ] **Frontend recibe:**
  - En F12: `📨 [SOCKET] Event received: message:new`
  
- [ ] **UI actualiza:**
  - Mensaje aparece automáticamente sin refrescar

---

## 📞 SI NADA FUNCIONA

**Envíame estos logs:**

1. **Logs completos de Railway** (últimos 100 líneas):
   ```bash
   # Desde que arranca hasta que intentas cargar mensajes
   ```

2. **Consola del navegador (F12 → Console):**
   ```bash
   # Filtra por "SOCKET" o "MESSAGE"
   ```

3. **Resultado de este endpoint:**
   ```bash
   curl https://tu-app.railway.app/api/debug/recent-messages
   ```

4. **Estado de los triggers:**
   ```bash
   railway connect postgres
   # En psql:
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers 
   WHERE trigger_name LIKE 'trigger_notify_%';
   ```

**Con estos logs podré identificar EXACTAMENTE dónde está el problema.** 🔍
