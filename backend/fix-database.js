// Script para arreglar la base de datos existente
// Ejecutar con: node fix-database.js

import 'dotenv/config'
import pkg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function fixDatabase() {
  console.log('🔧 Iniciando migración de base de datos...')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    // Leer script SQL
    const sqlPath = join(__dirname, '..', 'scripts', '04-fix-database.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Ejecutando script de migración...')
    
    // Ejecutar el script
    await pool.query(sql)
    
    console.log('✅ Base de datos migrada exitosamente!')
    
    // Verificar estructura
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'bots', 'conversations', 'messages')
      ORDER BY table_name, ordinal_position
    `)
    
    console.log('\n📊 Estructura de base de datos:')
    let currentTable = ''
    result.rows.forEach(row => {
      if (row.table_name !== currentTable) {
        console.log(`\n🔹 ${row.table_name.toUpperCase()}:`)
        currentTable = row.table_name
      }
      console.log(`   - ${row.column_name} (${row.data_type})`)
    })
    
    // Verificar datos
    const botsCount = await pool.query('SELECT COUNT(*) FROM bots')
    const usersCount = await pool.query('SELECT COUNT(*) FROM users')
    const conversationsCount = await pool.query('SELECT COUNT(*) FROM conversations')
    const messagesCount = await pool.query('SELECT COUNT(*) FROM messages')
    
    console.log('\n📈 Datos en base de datos:')
    console.log(`   - Usuarios: ${usersCount.rows[0].count}`)
    console.log(`   - Bots: ${botsCount.rows[0].count}`)
    console.log(`   - Conversaciones: ${conversationsCount.rows[0].count}`)
    console.log(`   - Mensajes: ${messagesCount.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Error al migrar base de datos:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

fixDatabase()
