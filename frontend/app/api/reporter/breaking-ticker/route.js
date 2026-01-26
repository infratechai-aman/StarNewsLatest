import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

export async function GET(request) {
    try {
        const result = await pool.query("SELECT * FROM settings WHERE key = 'breaking_ticker'")
        if (result.rows.length > 0 && result.rows[0].value) {
            const ticker = result.rows[0].value
            return NextResponse.json({
                ticker: {
                    text: ticker.texts?.join(' • ') || '',
                    texts: ticker.texts || [],
                    enabled: ticker.enabled,
                    updatedAt: result.rows[0].updated_at
                }
            })
        }
        return NextResponse.json({ ticker: null })
    } catch (error) {
        console.error('Reporter breaking ticker GET error:', error)
        return NextResponse.json({ ticker: null, error: error.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const { text } = body
        if (!text || !text.trim()) {
            return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
        }
        const texts = text.includes('•') ? text.split('•').map(t => t.trim()).filter(t => t) : [text.trim()]
        await pool.query(
            `INSERT INTO settings (id, key, value, updated_at) VALUES (gen_random_uuid(), 'breaking_ticker', $1, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
            [JSON.stringify({ texts, enabled: true })]
        )
        return NextResponse.json({ success: true, ticker: { text: text.trim(), texts, enabled: true, updatedAt: new Date() } })
    } catch (error) {
        console.error('Reporter breaking ticker PUT error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
