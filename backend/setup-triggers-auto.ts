// [TAG: Database]
// Setup automático de triggers PostgreSQL para LISTEN/NOTIFY en tiempo real
// Este script se ejecuta al iniciar el servidor y crea los triggers si no existen

import pkg from 'pg'
const { Client } = pkg

export async function setupTriggersIfNeeded() {
  console.log('[TRIGGERS] 🔧 Verificando triggers de PostgreSQL...')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()
    console.log('[TRIGGERS] ✅ Conectado a PostgreSQL')

    // Verificar si los triggers ya existen
    const checkQuery = `
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name IN ('trigger_notify_new_message', 'trigger_notify_new_conversation')
    `
    const existing = await client.query(checkQuery)
    
    if (existing.rows.length === 2) {
      console.log('[TRIGGERS] ✅ Triggers ya existen, no es necesario crearlos')
      await client.end()
      return true
    }

    console.log('[TRIGGERS] 📝 Creando triggers...')

    // =====================================================
    // TRIGGER para MENSAJES
    // =====================================================
    
    console.log('[TRIGGERS] 1/4 Creando función notify_new_message...')
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_new_message()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Emitir notificación INSTANTÁNEA en el canal 'new_message'
          PERFORM pg_notify(
              'new_message',
              json_build_object(
                  'message_id', NEW.id,
                  'conversation_id', NEW.conversation_id,
                  'sender', NEW.sender,
                  'created_at', NEW.created_at
              )::text
          );
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('[TRIGGERS] ✅ Función notify_new_message creada')

    console.log('[TRIGGERS] 2/4 Creando trigger para mensajes...')
    await client.query(`DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages`)
    await client.query(`
      CREATE TRIGGER trigger_notify_new_message
          AFTER INSERT ON messages
          FOR EACH ROW
          EXECUTE FUNCTION notify_new_message();
    `)
    console.log('[TRIGGERS] ✅ Trigger de mensajes creado')

    // =====================================================
    // TRIGGER para CONVERSACIONES
    // =====================================================
    
    console.log('[TRIGGERS] 3/4 Creando función notify_new_conversation...')
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_new_conversation()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Emitir notificación INSTANTÁNEA en el canal 'new_conversation'
          PERFORM pg_notify(
              'new_conversation',
              json_build_object(
                  'conversation_id', NEW.id,
                  'bot_id', NEW.bot_id,
                  'customer_phone', NEW.customer_phone,
                  'created_at', NEW.created_at
              )::text
          );
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('[TRIGGERS] ✅ Función notify_new_conversation creada')

    console.log('[TRIGGERS] 4/4 Creando trigger para conversaciones...')
    await client.query(`DROP TRIGGER IF EXISTS trigger_notify_new_conversation ON conversations`)
    await client.query(`
      CREATE TRIGGER trigger_notify_new_conversation
          AFTER INSERT ON conversations
          FOR EACH ROW
          EXECUTE FUNCTION notify_new_conversation();
    `)
    console.log('[TRIGGERS] ✅ Trigger de conversaciones creado')

    // Verificar que se crearon correctamente
    const verify = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trigger_notify_%'
      ORDER BY event_object_table
    `)

    console.log('[TRIGGERS] 📋 Triggers activos:')
    verify.rows.forEach(row => {
      console.log(`[TRIGGERS]    ✓ ${row.trigger_name} en tabla ${row.event_object_table}`)
    })

    console.log('[TRIGGERS] 🎉 Sistema LISTEN/NOTIFY configurado correctamente!')
    console.log('[TRIGGERS] 💡 PostgreSQL notificará INSTANTÁNEAMENTE cuando se inserte un mensaje')
    console.log('[TRIGGERS] 🚀 NO hay polling, es 100% en tiempo real')

    await client.end()
    return true

  } catch (error) {
    console.error('[TRIGGERS] ❌ Error configurando triggers:', error)
    console.log('[TRIGGERS] ⚠️  Continuando sin triggers - el sistema puede no funcionar en tiempo real')
    try {
      await client.end()
    } catch (e) {
      // Ignorar error al cerrar
    }
    return false
  }
}
