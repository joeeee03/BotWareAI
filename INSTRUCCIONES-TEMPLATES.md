# 📋 Instrucciones: Templates y Mensajes Programados

## 🗄️ Paso 1: Ejecutar Migración de Base de Datos en Railway

**IMPORTANTE**: Debes ejecutar esto **UNA SOLA VEZ** en la consola de PostgreSQL de Railway.

### Cómo hacerlo:

1. Ve a **Railway.app** → Tu proyecto → **PostgreSQL database**
2. Click en la pestaña **"Query"** o **"Console"**
3. Copia y pega **TODO** el contenido del archivo:
   ```
   database/migrations/add-templates-and-scheduled-messages.sql
   ```
4. Presiona **"Execute"** o **"Run Query"**
5. Deberías ver: ✅ "Command completed successfully"

### ¿Qué hace esta migración?

1. **Agrega columna `display_name`** a la tabla `users`
   - Para guardar el nombre que el usuario quiere mostrar

2. **Crea tabla `quick_reply_templates`**
   - Guarda plantillas de respuestas rápidas
   - Cada usuario tiene sus propias templates
   - Con atajos opcionales (ej: `/hola`)

3. **Crea tabla `scheduled_messages`**
   - Mensajes programados para enviar en fecha/hora específica
   - Se pueden enviar a múltiples conversaciones a la vez
   - Estados: pending, sent, failed, cancelled

---

## 🔧 Paso 2: Reiniciar Backend

Después de ejecutar la migración SQL, necesitas **reiniciar el backend** para que cargue las nuevas rutas:

```bash
cd backend
npm run dev
```

O si usas PM2:
```bash
pm2 restart backend
```

---

## 📡 Nuevos Endpoints Disponibles

### Templates (Quick Reply)

#### **GET /api/templates**
Obtener todos los templates del usuario
```json
Response:
{
  "templates": [
    {
      "id": 1,
      "title": "Saludo Inicial",
      "message": "¡Hola! 👋 ¿En qué puedo ayudarte?",
      "shortcut": "/hola",
      "category": "saludo",
      "created_at": "2025-11-17T...",
      "updated_at": "2025-11-17T..."
    }
  ],
  "total": 1
}
```

#### **POST /api/templates**
Crear un nuevo template
```json
Request:
{
  "title": "Saludo Inicial",
  "message": "¡Hola! 👋 ¿En qué puedo ayudarte?",
  "shortcut": "/hola",  // Opcional
  "category": "saludo"  // Opcional
}
```

#### **PUT /api/templates/:id**
Actualizar template existente

#### **DELETE /api/templates/:id**
Eliminar template

---

### Mensajes Programados

#### **GET /api/scheduled-messages**
Obtener mensajes programados
```json
Query params:
?status=pending  // Opcional: pending, sent, failed, cancelled

Response:
{
  "scheduled_messages": [
    {
      "id": 1,
      "bot_id": 1,
      "conversation_ids": [123, 456],
      "message": "Recordatorio de cita",
      "scheduled_for": "2025-11-18T10:00:00Z",
      "status": "pending",
      "created_at": "..."
    }
  ],
  "total": 1
}
```

#### **POST /api/scheduled-messages**
Programar nuevo mensaje
```json
Request:
{
  "bot_id": 1,
  "conversation_ids": [123, 456, 789],
  "message": "¡Hola! Este es un mensaje programado",
  "scheduled_for": "2025-11-18T10:00:00Z"  // Debe ser fecha futura
}
```

#### **PUT /api/scheduled-messages/:id**
Actualizar mensaje programado (solo si status = pending)

#### **DELETE /api/scheduled-messages/:id**
Cancelar mensaje programado (cambia status a 'cancelled')

---

## 🤖 Scheduler (Worker Automático)

El backend ahora incluye un **worker** que se ejecuta automáticamente cada 1 minuto para:

1. ✅ Buscar mensajes programados pendientes que llegaron a su hora
2. ✅ Enviarlos vía WhatsApp API
3. ✅ Guardarlos en la base de datos
4. ✅ Emitir eventos Socket.IO para actualización en tiempo real
5. ✅ Actualizar estado: `sent` o `failed`

**Logs que verás**:
```
[MESSAGE-SCHEDULER] 🕐 Starting message scheduler...
[MESSAGE-SCHEDULER] Will check for pending messages every 60 seconds
[MESSAGE-SCHEDULER] ✅ No pending messages to send
```

Cuando haya mensajes a enviar:
```
[MESSAGE-SCHEDULER] 📨 Found 3 messages to send
[MESSAGE-SCHEDULER] 📤 Sending scheduled message 1 to 2 conversation(s)
[MESSAGE-SCHEDULER] ✅ Sent to conversation 123
[MESSAGE-SCHEDULER] ✅ Scheduled message 1 sent successfully to all 2 conversations
```

---

## ✅ Verificar que Todo Funciona

1. **Verificar tablas creadas**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('quick_reply_templates', 'scheduled_messages');
   ```
   Deberías ver ambas tablas.

2. **Verificar rutas**:
   - Abre: `http://localhost:3001/health`
   - Deberías ver: `{ status: "ok" }`

3. **Probar crear un template**:
   ```bash
   curl -X POST http://localhost:3001/api/templates \
     -H "Authorization: Bearer TU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test",
       "message": "Hola",
       "shortcut": "/test"
     }'
   ```

---

## 🎯 Próximos Pasos

Una vez que hayas ejecutado la migración SQL y reiniciado el backend, continuaré con:

1. ✅ Frontend - Componente de Settings con engranaje
2. ✅ UI para gestionar templates
3. ✅ UI para programar mensajes
4. ✅ Integración de templates en el chat

---

## ❓ Troubleshooting

**Error: "relation already exists"**
- Significa que ya ejecutaste la migración antes
- Puedes ignorarlo, las tablas ya existen

**Error: "column already exists"**
- Similar al anterior, la columna ya fue agregada
- Puedes ignorarlo

**Backend no carga las rutas**
- Verifica que reiniciaste el backend después de la migración
- Revisa logs: `npm run dev` o `pm2 logs backend`

**Scheduler no se ejecuta**
- Verifica logs del backend al iniciar
- Deberías ver: `[MESSAGE-SCHEDULER] 🕐 Starting message scheduler...`
