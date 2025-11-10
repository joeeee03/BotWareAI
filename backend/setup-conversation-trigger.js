// Script para configurar el trigger de tiempo real para conversaciones en PostgreSQL
import 'dotenv/config'
import pkg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupConversationTrigger() {
  console.log('🔧 Configurando trigger de conversaciones en PostgreSQL...\n')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    // Leer script SQL
    const sqlPath = join(__dirname, '..', 'scripts', '06-add-conversation-trigger.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Ejecutando script de configuración...\n')
    
    // Ejecutar el script
    await pool.query(sql)
    
    console.log('✅ Trigger de conversaciones configurado exitosamente!\n')
    console.log('📋 Lo que se configuró:\n')
    console.log('   1. Función: notify_new_conversation()')
    console.log('   2. Trigger: trigger_notify_new_conversation')
    console.log('   3. Canal: new_conversation\n')
    console.log('🎯 Ahora cualquier INSERT en la tabla conversations emitirá:')
    console.log('   - Evento Socket.IO conversation:created a user room\n')
    console.log('🔄 Reinicia el backend para activar el listener:\n')
    console.log('   cd backend')
    console.log('   npm run dev\n')
    
  } catch (error) {
    console.error('❌ Error configurando trigger:', error.message)
    console.error('\nDetalles:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupConversationTrigger()
