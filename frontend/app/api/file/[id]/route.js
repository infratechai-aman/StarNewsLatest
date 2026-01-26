import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://starnews:StarNews@2026!@31.97.60.66:5432/starnews',
    ssl: false
})

export async function GET(request, { params }) {
    try {
        const id = params.id
        if (!id) {
            return new NextResponse('Missing ID', { status: 400 })
        }

        const result = await pool.query('SELECT * FROM file_uploads WHERE id = $1', [id])

        if (result.rows.length === 0) {
            return new NextResponse('File not found', { status: 404 })
        }

        const file = result.rows[0]
        // file.data is expected to be a Buffer (bytea) or Base64 string
        // If it's a Buffer, we can pass it directly.

        const headers = new Headers()
        headers.set('Content-Type', file.mime_type || 'application/octet-stream')
        headers.set('Content-Disposition', `inline; filename="${file.filename}"`)
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')

        return new NextResponse(file.data, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('File serve error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
