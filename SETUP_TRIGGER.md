# Configurar Trigger PostgreSQL para Tiempo Real

Este trigger detecta cuando se insertan mensajes en la tabla `messages` desde **cualquier fuente externa** (otros proyectos, scripts, etc.) y los emite automáticamente vía Socket.IO.

## 🎯 Qué Hace

Cuando otro proyecto inserta un mensaje en la tabla `messages`:
```sql
INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
VALUES (7, 1, 'user', 'Hola desde otro proyecto', NOW());
```

El trigger detecta el INSERT y:
1. ✅ Emite NOTIFY a PostgreSQL
2. ✅ El backend detecta el NOTIFY
3. ✅ Desencripta el mensaje
4. ✅ Emite el mensaje vía Socket.IO
5. ✅ El frontend recibe y muestra el mensaje automáticamente

## 📦 Instalación en Railway

### Opción 1: Ejecutar SQL manualmente en Railway

1. Ir a Railway → Tu proyecto → PostgreSQL
2. Click en "Data" o "Connect"
3. Usar el cliente de PostgreSQL para ejecutar:

```sql
-- Crear función que emite NOTIFY
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_message',
    json_build_object(
      'id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'bot_id', NEW.bot_id,
      'sender', NEW.sender,
      'message', NEW.message,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS message_insert_trigger ON messages;

-- Crear trigger en INSERT
CREATE TRIGGER message_insert_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
```

### Opción 2: Usar psql desde terminal local

```bash
# Conectar a Railway PostgreSQL
psql "postgresql://postgres:PASSWORD@HOST:PORT/railway"

# Ejecutar el archivo
\i scripts/setup-message-trigger.sql
```

### Opción 3: Usar script Node.js

```bash
npm run setup:trigger
```

## ✅ Verificar que Funciona

1. Conectar a Railway PostgreSQL
2. Insertar un mensaje de prueba:
```sql
INSERT INTO messages (conversation_id, bot_id, sender, message, created_at)
VALUES (7, 1, 'user', 'Mensaje de prueba', NOW());
```

3. Ver en los logs del backend en Railway:
```
[MESSAGE-LISTENER] 📨 Nuevo mensaje detectado: {id: 123, conversation_id: 7, sender: 'user'}
[MESSAGE-LISTENER] 🔓 Mensaje desencriptado
[MESSAGE-LISTENER] 📤 Emitiendo message:new a room: conversation_7
[MESSAGE-LISTENER] ✅ Mensaje emitido vía Socket.IO
```

4. Ver en el frontend (consola del navegador):
```
📨 [MESSAGE-THREAD] New message received: {id: 123, message: "Mensaje de prueba"}
✅ [MESSAGE-THREAD] Adding message to current conversation
```

## 🔧 Troubleshooting

### "Error: permission denied for table messages"
- El usuario de PostgreSQL necesita permisos para crear triggers
- Ejecutar como superuser o pedir a Railway que agregue permisos

### "Listener no se conecta"
- Verificar variables de entorno DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- Verificar que PostgreSQL permite conexiones desde el backend

### "No se emiten mensajes"
- Verificar en logs del backend que dice "[MESSAGE-LISTENER] ✅ Escuchando canal 'new_message'"
- Insertar un mensaje de prueba y verificar logs

## 📝 Notas

- El listener se reconecta automáticamente si pierde la conexión
- Los mensajes se desencriptan antes de emitirse vía Socket.IO
- Funciona con cualquier fuente que inserte en la tabla `messages`
