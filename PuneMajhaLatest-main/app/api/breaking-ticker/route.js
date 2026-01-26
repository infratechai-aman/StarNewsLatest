import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'

// GET - Fetch current breaking ticker (array of texts)
export async function GET() {
    try {
        await connectDB()
        const db = mongoose.connection.db

        // Get breaking ticker settings
        const ticker = await db.collection('settings').findOne({ key: 'breaking_ticker' })

        if (ticker && ticker.enabled && ticker.texts && ticker.texts.length > 0) {
            // Remove duplicates and join texts
            const uniqueTexts = [...new Set(ticker.texts)]
            const combinedText = uniqueTexts.join(' • ')

            return NextResponse.json({
                enabled: true,
                text: combinedText,
                texts: uniqueTexts, // Array of individual texts
                lastUpdated: ticker.updatedAt
            })
        }

        return NextResponse.json({ enabled: false, text: '', texts: [] })
    } catch (error) {
        console.error('Breaking ticker GET error:', error)
        return NextResponse.json({ enabled: false, text: '', texts: [] })
    }
}

// POST - Update breaking ticker (add/edit/delete texts)
export async function POST(request) {
    try {
        const body = await request.json()
        const { action, text, texts, enabled } = body

        await connectDB()
        const db = mongoose.connection.db

        // Get current ticker settings
        let ticker = await db.collection('settings').findOne({ key: 'breaking_ticker' })
        if (!ticker) {
            ticker = { key: 'breaking_ticker', enabled: true, texts: [], updatedAt: new Date() }
        }

        let updatedTexts = ticker.texts || []

        switch (action) {
            case 'add':
                // Add new text at the beginning (LEFT = newest)
                if (text && text.trim()) {
                    // Remove duplicates before adding
                    updatedTexts = updatedTexts.filter(t => t.toLowerCase() !== text.toLowerCase().trim())
                    updatedTexts.unshift(text.trim()) // Add to front
                }
                break

            case 'delete':
                // Remove specific text
                if (text) {
                    updatedTexts = updatedTexts.filter(t => t !== text)
                }
                break

            case 'edit':
                // Replace all texts with new array
                if (texts && Array.isArray(texts)) {
                    // Remove duplicates
                    updatedTexts = [...new Set(texts.filter(t => t && t.trim()))]
                }
                break

            case 'toggle':
                // Enable/disable ticker
                await db.collection('settings').updateOne(
                    { key: 'breaking_ticker' },
                    { $set: { enabled: enabled !== undefined ? enabled : !ticker.enabled, updatedAt: new Date() } },
                    { upsert: true }
                )
                return NextResponse.json({ success: true, enabled: enabled !== undefined ? enabled : !ticker.enabled })

            case 'set':
                // Set single text (legacy support)
                if (text !== undefined) {
                    updatedTexts = text.trim() ? [text.trim()] : []
                }
                break

            default:
                // Default: set texts array
                if (texts && Array.isArray(texts)) {
                    updatedTexts = [...new Set(texts.filter(t => t && t.trim()))]
                } else if (text !== undefined) {
                    updatedTexts = text.trim() ? [text.trim()] : []
                }
        }

        // Update database
        await db.collection('settings').updateOne(
            { key: 'breaking_ticker' },
            {
                $set: {
                    texts: updatedTexts,
                    enabled: enabled !== undefined ? enabled : true,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        )

        return NextResponse.json({
            success: true,
            texts: updatedTexts,
            text: updatedTexts.join(' • ')
        })
    } catch (error) {
        console.error('Breaking ticker POST error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
