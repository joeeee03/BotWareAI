-- Script para agregar triggers que detecten CUALQUIER insert en conversations
-- y notifiquen al backend para emitir eventos Socket.IO

-- ====================================
-- PASO 1: Crear función que notifica
-- ====================================

CREATE OR REPLACE FUNCTION notify_new_conversation()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  -- Construir payload con toda la información de la conversación
  payload = json_build_object(
    'conversation_id', NEW.id,
    'bot_id', NEW.bot_id,
    'customer_phone', NEW.customer_phone,
    'customer_name', NEW.customer_name,
    'created_at', NEW.created_at
  );

  -- Enviar notificación a través del canal 'new_conversation'
  PERFORM pg_notify('new_conversation', payload::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- PASO 2: Crear trigger en tabla conversations
-- ====================================

DROP TRIGGER IF EXISTS trigger_notify_new_conversation ON conversations;

CREATE TRIGGER trigger_notify_new_conversation
AFTER INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION notify_new_conversation();

-- ====================================
-- PASO 3: Verificar que funciona
-- ====================================

-- Para probar, ejecuta en otra terminal:
-- LISTEN new_conversation;
-- Luego inserta una conversación y deberías ver la notificación

SELECT 'Trigger creado exitosamente!' AS status;
SELECT 'Ahora cualquier INSERT en conversations emitirá una notificación' AS info;
