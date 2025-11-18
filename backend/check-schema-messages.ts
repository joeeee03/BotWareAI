import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkSchema() {
  try {
    console.log('=== VERIFICANDO ESQUEMA DE TABLA MESSAGES ===\n');
    
    // Get table structure
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(schemaQuery);
    
    console.log('Columnas actuales de la tabla messages:');
    console.log('---------------------------------------------');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Check if type and url columns exist
    const hasType = result.rows.some(row => row.column_name === 'type');
    const hasUrl = result.rows.some(row => row.column_name === 'url');
    
    console.log('\n---------------------------------------------');
    console.log(`¿Tiene columna 'type'? ${hasType ? '✅ SÍ' : '❌ NO'}`);
    console.log(`¿Tiene columna 'url'? ${hasUrl ? '✅ SÍ' : '❌ NO'}`);
    
    if (!hasType || !hasUrl) {
      console.log('\n⚠️  ACCIÓN REQUERIDA: Necesitas agregar las columnas faltantes');
      console.log('\nSQL sugerido:');
      if (!hasType) {
        console.log("ALTER TABLE messages ADD COLUMN type VARCHAR(20) DEFAULT 'text';");
      }
      if (!hasUrl) {
        console.log("ALTER TABLE messages ADD COLUMN url TEXT;");
      }
    } else {
      console.log('\n✅ La tabla ya tiene las columnas necesarias para multimedia!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
