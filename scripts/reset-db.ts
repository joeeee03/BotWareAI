// [TAG: RESET]
// Script para eliminar completamente el schema/public de la base de datos y volver a cargar los scripts de tablas y seed.

import { Pool } from "pg"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

// Cargar variables de entorno (busca .env en la raíz del repo)
dotenv.config({ path: path.join(__dirname, "../.env") })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

async function resetDb() {
  try {
    console.log("🚨 Iniciando reset de la base de datos...")

    // Probar conexión
    await pool.query("SELECT NOW()")
    console.log("✅ Conectado a la base de datos")

  // DROP / CREATE schema public
  console.log("\n🗑  Eliminando schema public (DROP SCHEMA public CASCADE)...")
    await pool.query("DROP SCHEMA public CASCADE;")
    await pool.query("CREATE SCHEMA public;")
    console.log("✅ Schema public recreado")

    // Ejecutar script de creación de tablas
    console.log("\n📋 Creando tablas (01-create-tables.sql)...")
    const createTablesSQL = fs.readFileSync(path.join(__dirname, "01-create-tables.sql"), "utf8")
    await pool.query(createTablesSQL)
    console.log("✅ Tablas creadas")

    // Ejecutar seed realista
    console.log("\n📦 Cargando datos de ejemplo (03-production-realistic-seed.sql)...")
    const seedSQL = fs.readFileSync(path.join(__dirname, "03-production-realistic-seed.sql"), "utf8")
    await pool.query(seedSQL)
    console.log("✅ Datos de ejemplo cargados")

    // Verificar conteos
    console.log("\n🔍 Verificando datos...")
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM bots) as bots,
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM messages) as messages
    `)

    console.log("\n📊 Resumen de datos:")
    console.log(`   Usuarios: ${result.rows[0].users}`)
    console.log(`   Bots: ${result.rows[0].bots}`)
    console.log(`   Conversaciones: ${result.rows[0].conversations}`)
    console.log(`   Mensajes: ${result.rows[0].messages}`)

    console.log("\n🎉 Reset y seed completados correctamente")
  } catch (error) {
    console.error("❌ Error durante reset:", error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

resetDb().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
