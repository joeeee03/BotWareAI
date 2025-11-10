// Script para configurar el trigger de tiempo real en PostgreSQL
import 'dotenv/config'
import pkg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupRealtime() {
  console.log('🔧 Configurando triggers de tiempo real en PostgreSQL...\n')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    // Leer script SQL
    const sqlPath = join(__dirname, '..', 'scripts', '05-add-realtime-trigger.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Ejecutando script de configuración...\n')
    
    // Ejecutar el script
    await pool.query(sql)
    
    console.log('✅ Triggers de tiempo real configurados exitosamente!\n')
    console.log('📋 Lo que se configuró:\n')
    console.log('   1. Función: notify_new_message()')
    console.log('   2. Trigger: trigger_notify_new_message')
    console.log('   3. Canal: new_message\n')
    console.log('🎯 Ahora cualquier INSERT en la tabla messages emitirá:')
    console.log('   - Evento Socket.IO message:new a conversation room')
    console.log('   - Evento Socket.IO conversation:updated a user room\n')
    console.log('🔄 Reinicia el backend para activar el listener:\n')
    console.log('   cd backend')
    console.log('   npm run dev\n')
    
  } catch (error) {
    console.error('❌ Error configurando triggers:', error.message)
    console.error('\nDetalles:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupRealtime()
