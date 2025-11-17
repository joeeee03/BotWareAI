-- Trigger para detectar nuevos mensajes insertados en la tabla messages
-- Este trigger emite un NOTIFY cada vez que se inserta un mensaje
-- Permitiendo que el backend detecte mensajes insertados desde cualquier fuente

-- Crear función que emite NOTIFY
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Emitir notificación con los datos del mensaje
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

-- Confirmar creación
SELECT 'Trigger notify_new_message creado exitosamente' AS status;
