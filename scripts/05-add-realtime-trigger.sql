-- Script para agregar triggers que detecten CUALQUIER insert en messages
-- y notifiquen al backend para emitir eventos Socket.IO

-- ====================================
-- PASO 1: Crear función que notifica
-- ====================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  -- Construir payload con toda la información del mensaje
  payload = json_build_object(
    'message_id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'bot_id', NEW.bot_id,
    'sender', NEW.sender,
    'message', NEW.message,
    'created_at', NEW.created_at
  );

  -- Enviar notificación a través del canal 'new_message'
  PERFORM pg_notify('new_message', payload::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- PASO 2: Crear trigger en tabla messages
-- ====================================

DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;

CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- ====================================
-- PASO 3: Verificar que funciona
-- ====================================

-- Para probar, ejecuta en otra terminal:
-- LISTEN new_message;
-- Luego inserta un mensaje y deberías ver la notificación

SELECT 'Trigger creado exitosamente!' AS status;
SELECT 'Ahora cualquier INSERT en messages emitirá una notificación' AS info;
