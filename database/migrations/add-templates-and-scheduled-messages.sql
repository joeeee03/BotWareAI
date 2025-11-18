-- ============================================
-- MIGRACIÓN: Templates y Mensajes Programados
-- Fecha: 2025-11-17
-- Descripción: Agrega funcionalidad de templates de respuestas rápidas
--              y mensajes programados sin modificar tablas existentes
-- ============================================

-- 1. Agregar nombre para mostrar a usuarios existentes
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- 2. Tabla de templates de respuestas rápidas
CREATE TABLE IF NOT EXISTS quick_reply_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,  -- Ej: "Saludo inicial", "Horarios", etc.
  message TEXT NOT NULL,         -- El contenido del template
  shortcut VARCHAR(20),          -- Atajo opcional, ej: "/hola"
  category VARCHAR(50),          -- Categoría: "saludo", "info", "despedida", etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de mensajes programados
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
  conversation_ids INTEGER[] NOT NULL,  -- Array de IDs de conversaciones a las que enviar
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,   -- Fecha y hora programada
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  sent_at TIMESTAMPTZ,                  -- Cuando se envió realmente
  error_message TEXT,                   -- Si falló, el error
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_user_id ON quick_reply_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_shortcut ON quick_reply_templates(shortcut);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON scheduled_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para auto-actualizar updated_at
DROP TRIGGER IF EXISTS update_quick_reply_templates_updated_at ON quick_reply_templates;
CREATE TRIGGER update_quick_reply_templates_updated_at BEFORE UPDATE ON quick_reply_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_messages_updated_at ON scheduled_messages;
CREATE TRIGGER update_scheduled_messages_updated_at BEFORE UPDATE ON scheduled_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE quick_reply_templates IS 'Plantillas de respuestas rápidas configurables por usuario';
COMMENT ON TABLE scheduled_messages IS 'Mensajes programados para enviar en fecha/hora específica';
COMMENT ON COLUMN users.display_name IS 'Nombre para mostrar del usuario en la interfaz';

-- ============================================
-- DATOS DE PRUEBA (Opcional - Comentar si no se desea)
-- ============================================

-- Templates de ejemplo para el usuario host
-- INSERT INTO quick_reply_templates (user_id, title, message, shortcut, category)
-- VALUES 
--   (1, 'Saludo Inicial', '¡Hola! 👋 Gracias por contactarnos. ¿En qué podemos ayudarte hoy?', '/hola', 'saludo'),
--   (1, 'Horarios de Atención', 'Nuestros horarios de atención son:\n📅 Lunes a Viernes: 9:00 - 18:00\n📅 Sábados: 9:00 - 13:00', '/horarios', 'info'),
--   (1, 'Despedida', 'Gracias por contactarnos. ¡Que tengas un excelente día! 😊', '/adios', 'despedida');

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
