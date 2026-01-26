import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

export async function POST(request) {
    try {
        const body = await request.json()
        const { fullName, phone, email, experience, portfolio, reason } = body
        if (!fullName || !phone || !email) {
            return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 })
        }
        const existing = await pool.query('SELECT id FROM reporter_applications WHERE email = $1', [email.toLowerCase()])
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'An application with this email already exists' }, { status: 400 })
        }
        const result = await pool.query(
            `INSERT INTO reporter_applications (id, full_name, phone, email, experience, portfolio, reason, status, submitted_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'PENDING', NOW(), NOW()) RETURNING id`,
            [fullName.trim(), phone.trim(), email.toLowerCase().trim(), experience?.trim() || '', portfolio?.trim() || '', reason?.trim() || '']
        )
        return NextResponse.json({ success: true, message: 'Application submitted successfully', id: result.rows[0].id })
    } catch (error) {
        console.error('Reporter application POST error:', error)
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const result = await pool.query('SELECT * FROM reporter_applications ORDER BY submitted_at DESC')
        return NextResponse.json({ applications: result.rows })
    } catch (error) {
        console.error('Reporter applications GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const body = await request.json()
        const { id, status, adminNote } = body
        if (!id || !status || !['PENDING', 'CONTACTED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'ID and valid status are required' }, { status: 400 })
        }
        await pool.query('UPDATE reporter_applications SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3', [status, adminNote || '', id])
        return NextResponse.json({ success: true, message: 'Application updated' })
    } catch (error) {
        console.error('Reporter application PUT error:', error)
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }
        await pool.query('DELETE FROM reporter_applications WHERE id = $1', [id])
        return NextResponse.json({ success: true, message: 'Application deleted' })
    } catch (error) {
        console.error('Reporter application DELETE error:', error)
        return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
    }
}
