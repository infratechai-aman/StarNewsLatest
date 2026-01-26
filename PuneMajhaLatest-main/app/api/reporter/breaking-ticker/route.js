import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'

// GET - Fetch current breaking ticker for reporter
export async function GET(request) {
    try {
        await connectDB()
        const db = mongoose.connection.db

        // Get breaking ticker settings
        const ticker = await db.collection('settings').findOne({ key: 'breaking_ticker' })

        if (ticker) {
            return NextResponse.json({
                ticker: {
                    text: ticker.texts?.join(' • ') || ticker.text || '',
                    texts: ticker.texts || [],
                    enabled: ticker.enabled,
                    updatedAt: ticker.updatedAt,
                    updatedBy: ticker.updatedBy
                }
            })
        }

        return NextResponse.json({ ticker: null })
    } catch (error) {
        console.error('Reporter breaking ticker GET error:', error)
        return NextResponse.json({ ticker: null, error: error.message }, { status: 500 })
    }
}

// PUT - Update breaking ticker from reporter panel
export async function PUT(request) {
    try {
        const body = await request.json()
        const { text } = body

        if (!text || !text.trim()) {
            return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
        }

        await connectDB()
        const db = mongoose.connection.db

        // Get reporter info from auth header (optional - for tracking who updated)
        const authHeader = request.headers.get('Authorization')
        let reporterEmail = 'reporter'
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '')
                // Basic token decode - in production you'd verify the JWT
                const payload = JSON.parse(atob(token.split('.')[1]))
                reporterEmail = payload.email || 'reporter'
            } catch (e) {
                // Ignore token parse errors
            }
        }

        // Split text by bullet point separator if present, otherwise use as single item
        const texts = text.includes('•')
            ? text.split('•').map(t => t.trim()).filter(t => t)
            : [text.trim()]

        // Update the breaking ticker in the database
        await db.collection('settings').updateOne(
            { key: 'breaking_ticker' },
            {
                $set: {
                    texts: texts,
                    text: text.trim(), // Keep legacy field for compatibility
                    enabled: true,
                    updatedAt: new Date(),
                    updatedBy: reporterEmail
                }
            },
            { upsert: true }
        )

        return NextResponse.json({
            success: true,
            ticker: {
                text: text.trim(),
                texts: texts,
                enabled: true,
                updatedAt: new Date(),
                updatedBy: reporterEmail
            }
        })
    } catch (error) {
        console.error('Reporter breaking ticker PUT error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
