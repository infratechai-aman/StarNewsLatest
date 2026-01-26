import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

export async function POST(request) {
    try {
        const body = await request.json()
        const { businessName, ownerName, phone, email, address, description } = body
        if (!businessName || !ownerName || !phone || !email || !address) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }
        const result = await pool.query(
            `INSERT INTO business_promotions (id, business_name, owner_name, phone, email, address, description, status, submitted_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'PENDING', NOW(), NOW()) RETURNING id`,
            [businessName.trim(), ownerName.trim(), phone.trim(), email.toLowerCase().trim(), address.trim(), description?.trim() || '']
        )
        return NextResponse.json({ success: true, message: 'Promotion request submitted successfully', id: result.rows[0].id })
    } catch (error) {
        console.error('Business promotion POST error:', error)
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const result = await pool.query('SELECT * FROM business_promotions ORDER BY submitted_at DESC')
        return NextResponse.json({ promotions: result.rows })
    } catch (error) {
        console.error('Business promotion GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
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
        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
        }
        await pool.query('UPDATE business_promotions SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3', [status, adminNote || '', id])
        return NextResponse.json({ success: true, message: 'Request updated' })
    } catch (error) {
        console.error('Business promotion PUT error:', error)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
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
        await pool.query('DELETE FROM business_promotions WHERE id = $1', [id])
        return NextResponse.json({ success: true, message: 'Request deleted' })
    } catch (error) {
        console.error('Business promotion DELETE error:', error)
        return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }
}
