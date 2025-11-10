// [TAG: DB]
// PostgreSQL database connection configuration

import { Pool } from "pg"

// (No debug logging) Ensure dotenv is loaded before this module so env vars are available
// End of DB config

// Railway connection - remove sslmode parameter and disable SSL for now
const dbUrl = process.env.DATABASE_URL?.replace('?sslmode=require', '') || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: false,
})

// Test connection
pool.on("connect", () => {
  console.log("[v0] Database connected successfully")
})

pool.on("error", (err: Error) => {
  console.error("[v0] Unexpected database error:", err)
  process.exit(-1)
})

export default pool
