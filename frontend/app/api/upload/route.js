import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

// Route segment config
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Increase body limit again just in case (handled in global config too)
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '15mb',
        },
    },
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://starnews:StarNews@2026!@31.97.60.66:5432/starnews',
    ssl: false
})

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileExtension = path.extname(file.name).toLowerCase()
        const mimeType = file.type
        const uniqueId = uuidv4()

        // Ensure table exists (Emergency Fix Logic)
        await pool.query(`
          CREATE TABLE IF NOT EXISTS file_uploads (
            id UUID PRIMARY KEY,
            filename TEXT,
            mime_type TEXT,
            data BYTEA,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `)

        // Insert into DB
        await pool.query(
            'INSERT INTO file_uploads (id, filename, mime_type, data) VALUES ($1, $2, $3, $4)',
            [uniqueId, file.name, mimeType, buffer]
        )

        // Return the new "DB URL"
        const publicUrl = `/api/file/${uniqueId}`

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: file.name,
            type: mimeType.startsWith('image/') ? 'image' : 'pdf'
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({
            error: 'Upload failed: ' + error.message,
            details: error.stack,
            code: error.code // Postgres error code
        }, { status: 500 })
    }
}
