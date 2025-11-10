// [TAG: SEED]
// Script para ejecutar el seed de producción en Railway PostgreSQL

import { Pool } from "pg"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, "../.env") })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

async function runSeed() {
  try {
    console.log("🚀 Conectando a Railway PostgreSQL...")

    // Test connection
    await pool.query("SELECT NOW()")
    console.log("✅ Conexión establecida")

    // Leer y ejecutar el script de tablas
    console.log("\n📋 Creando tablas...")
    const createTablesSQL = fs.readFileSync(path.join(__dirname, "01-create-tables.sql"), "utf8")
    await pool.query(createTablesSQL)
    console.log("✅ Tablas creadas")

    // Leer y ejecutar el script de seed realista
    console.log("\n📦 Cargando datos de producción...")
    const seedSQL = fs.readFileSync(path.join(__dirname, "03-production-realistic-seed.sql"), "utf8")
    await pool.query(seedSQL)
    console.log("✅ Datos cargados exitosamente")

    // Verificar los datos
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

    console.log("\n🎉 Seed completado exitosamente!")
    console.log("\n📝 Credenciales de acceso:")
    console.log("   Email: owner@negocio.com")
    console.log("   Contraseña: hola1234")
  } catch (error) {
    console.error("❌ Error ejecutando el seed:", error)
    throw error
  } finally {
    await pool.end()
  }
}

// Ejecutar el seed
runSeed().catch((error) => {
  console.error("Error fatal:", error)
  process.exit(1)
})
