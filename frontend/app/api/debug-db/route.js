import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

const pool = new Pool({
    connectionString: 'postgresql://starnews:StarNews@2026!@31.97.60.66:5432/starnews',
    ssl: false, // Ensure SSL is false, as we are using IP 
    connectionTimeoutMillis: 5000 // Fail fast
})

export async function GET() {
    let client;
    try {
        const start = Date.now()
        console.log('Attempting DB connection...')
        client = await pool.connect()
        const result = await client.query('SELECT NOW()')
        client.release()

        return NextResponse.json({
            status: 'success',
            message: 'Database connection successful',
            timeMs: Date.now() - start,
            timestamp: result.rows[0].now
        })
    } catch (error) {
        console.error('DB Connection Failed:', error)
        return NextResponse.json({
            status: 'error',
            error: error.message,
            stack: error.stack,
            hint: 'This is likely a Firewall issue. Vercel IPs must be allowed on the VPS (31.97.60.66).'
        }, { status: 500 })
    }
}
