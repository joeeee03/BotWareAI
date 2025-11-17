# Configurar Trigger para Nuevas Conversaciones

Este trigger detecta cuando se crean nuevas conversaciones en la tabla `conversations` desde **cualquier fuente externa** y las agrega automáticamente a la lista en tiempo real.

## 🎯 Qué Hace

Cuando otro proyecto inserta una conversación:
```sql
INSERT INTO conversations (bot_id, customer_phone, customer_name, created_at)
VALUES (1, '+1234567890', 'Cliente Nuevo', NOW());
```

El trigger detecta el INSERT y:
1. ✅ Emite NOTIFY a PostgreSQL
2. ✅ El backend detecta el NOTIFY  
3. ✅ Emite la conversación vía Socket.IO
4. ✅ El frontend recibe y agrega la conversación automáticamente
5. ✅ Las conversaciones se ordenan por mensaje más reciente

## 📦 Instalación en Railway

### Ejecutar en Railway PostgreSQL

1. Ir a Railway → Tu proyecto → PostgreSQL → "Query" o "Data"
2. Ejecutar:

```sql
-- Crear función que emite NOTIFY para nuevas conversaciones
CREATE OR REPLACE FUNCTION notify_new_conversation()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload = json_build_object(
    'conversation_id', NEW.id,
    'bot_id', NEW.bot_id,
    'customer_phone', NEW.customer_phone,
    'customer_name', NEW.customer_name,
    'created_at', NEW.created_at
  );

  PERFORM pg_notify('new_conversation', payload::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_notify_new_conversation ON conversations;

-- Crear trigger en INSERT
CREATE TRIGGER trigger_notify_new_conversation
AFTER INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION notify_new_conversation();
```

## ✅ Verificar que Funciona

1. Insertar una conversación de prueba desde otro proyecto:
```sql
INSERT INTO conversations (bot_id, customer_phone, customer_name, created_at)
VALUES (1, '+1234567890', 'Prueba Tiempo Real', NOW());
```

2. Ver en logs del backend (Railway):
```
[MESSAGE-LISTENER] 🆕 Nueva conversación detectada: {id: 123, customer_phone: '+1234567890'}
[MESSAGE-LISTENER] 📤 Emitiendo conversation:new a room: user_1
[MESSAGE-LISTENER] ✅ Nueva conversación emitida vía Socket.IO
```

3. Ver en frontend (consola navegador):
```
🆕 [CHATS-PAGE] New conversation created: {id: 123, customer_phone: '+1234567890'}
```

4. La conversación aparece automáticamente en la lista sin recargar

## 🔄 Ordenamiento Automático

Las conversaciones se ordenan automáticamente por:
1. **Mensaje más reciente primero** (cuando hay mensajes)
2. **Conversación más nueva primero** (cuando no hay mensajes)

Cada vez que llega un mensaje nuevo, la conversación sube al tope de la lista.

## 📝 Funcionalidad Completa

✅ Nuevas conversaciones aparecen automáticamente
✅ Mensajes nuevos reordenan la lista (más reciente arriba)
✅ Actualización en tiempo real sin recargar
✅ Funciona con inserts desde cualquier proyecto/script
✅ Estilo WhatsApp: conversaciones con actividad reciente arriba
