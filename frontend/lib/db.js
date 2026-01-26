import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

export async function connectDB() {
    return pool
}

export function getConnection() {
    return pool
}

export async function disconnectDB() {
    await pool.end()
}

export default pool
