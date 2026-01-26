import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
})

export async function GET() {
    try {
        const result = await pool.query("SELECT * FROM settings WHERE key = 'breaking_ticker'")
        if (result.rows.length > 0 && result.rows[0].value) {
            const ticker = result.rows[0].value
            if (ticker.enabled && ticker.texts && ticker.texts.length > 0) {
                return NextResponse.json({ enabled: true, text: ticker.texts.join(' • '), texts: ticker.texts, lastUpdated: result.rows[0].updated_at })
            }
        }
        return NextResponse.json({ enabled: false, text: '', texts: [] })
    } catch (error) {
        console.error('Breaking ticker GET error:', error)
        return NextResponse.json({ enabled: false, text: '', texts: [] })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { action, text, texts, enabled } = body
        
        let result = await pool.query("SELECT * FROM settings WHERE key = 'breaking_ticker'")
        let currentTexts = result.rows.length > 0 && result.rows[0].value ? result.rows[0].value.texts || [] : []
        let updatedTexts = [...currentTexts]

        switch (action) {
            case 'add':
                if (text && text.trim()) {
                    updatedTexts = updatedTexts.filter(t => t.toLowerCase() !== text.toLowerCase().trim())
                    updatedTexts.unshift(text.trim())
                }
                break
            case 'delete':
                if (text) updatedTexts = updatedTexts.filter(t => t !== text)
                break
            case 'edit':
                if (texts && Array.isArray(texts)) updatedTexts = [...new Set(texts.filter(t => t && t.trim()))]
                break
            case 'toggle':
                await pool.query(
                    `INSERT INTO settings (id, key, value, updated_at) VALUES (gen_random_uuid(), 'breaking_ticker', $1, NOW())
                     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
                    [JSON.stringify({ enabled: enabled !== undefined ? enabled : true, texts: currentTexts })]
                )
                return NextResponse.json({ success: true, enabled: enabled !== undefined ? enabled : true })
            default:
                if (texts && Array.isArray(texts)) updatedTexts = [...new Set(texts.filter(t => t && t.trim()))]
                else if (text !== undefined) updatedTexts = text.trim() ? [text.trim()] : []
        }

        await pool.query(
            `INSERT INTO settings (id, key, value, updated_at) VALUES (gen_random_uuid(), 'breaking_ticker', $1, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
            [JSON.stringify({ texts: updatedTexts, enabled: enabled !== undefined ? enabled : true })]
        )
        return NextResponse.json({ success: true, texts: updatedTexts, text: updatedTexts.join(' • ') })
    } catch (error) {
        console.error('Breaking ticker POST error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
