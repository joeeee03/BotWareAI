// [TAG: DB]
// PostgreSQL database connection configuration

import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Fallback to individual variables if DATABASE_URL is not set
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number.parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE,
})

// Test connection
pool.on("connect", () => {
  console.log("[v0] Database connected successfully to Railway PostgreSQL")
})

pool.on("error", (err: Error) => {
  console.error("[v0] Unexpected database error:", err)
  process.exit(-1)
})

export default pool
