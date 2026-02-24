import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Breaking Ticker
export async function GET(request) {
    try {
        const db = getDb();
        if (!db) {
            return NextResponse.json({ enabled: false, text: '', texts: [] });
        }
        // Assuming a single document 'main' in 'breaking_ticker' collection
        const doc = await db.collection('breaking_ticker').doc('main').get();

        if (!doc.exists) {
            return NextResponse.json({ enabled: false, text: '', texts: [] });
        }

        const t = doc.data();
        if (t.status !== 'active') {
            return NextResponse.json({ enabled: false, text: '', texts: [] });
        }

        return NextResponse.json({
            enabled: true,
            text: t.text,
            texts: t.texts || [],
            updatedAt: t.updatedAt
        });
    } catch (error) {
        console.error('Error fetching ticker:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
