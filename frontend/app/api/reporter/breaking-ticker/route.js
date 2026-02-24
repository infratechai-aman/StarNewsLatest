import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
    try {
        const db = getDb();
        if (!db) {
            return NextResponse.json({ ticker: null, error: 'Database connection failed' }, { status: 503 });
        }

        const doc = await db.collection('breaking_ticker').doc('main').get();

        if (doc.exists && doc.data().enabled) {
            const data = doc.data();
            return NextResponse.json({
                ticker: {
                    text: data.texts?.join(' • ') || data.text || '',
                    texts: data.texts || [],
                    enabled: data.enabled,
                    updatedAt: data.updatedAt
                }
            });
        }
        return NextResponse.json({ ticker: null });
    } catch (error) {
        console.error('Reporter breaking ticker GET error:', error);
        return NextResponse.json({ ticker: null, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        if (!db) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 503 });
        }

        const body = await request.json();
        const { text } = body;

        if (!text || !text.trim()) {
            return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
        }

        const texts = text.includes('•') ? text.split('•').map(t => t.trim()).filter(t => t) : [text.trim()];

        const updateData = {
            text: text.trim(),
            texts,
            enabled: true,
            status: 'active',
            updatedAt: new Date().toISOString()
        };

        await db.collection('breaking_ticker').doc('main').set(updateData, { merge: true });

        return NextResponse.json({ success: true, ticker: updateData });
    } catch (error) {
        console.error('Reporter breaking ticker PUT error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
