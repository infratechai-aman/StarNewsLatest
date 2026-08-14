import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Admin Pending Ticker (For Review)
export async function GET(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
        const doc = await db.collection('breaking_ticker').doc('main').get();

        if (!doc.exists) {
            return NextResponse.json({ ticker: null });
        }

        const t = doc.data();

        return NextResponse.json({
            ticker: {
                text: t.text,
                pendingText: t.pendingText,
                pendingStatus: t.pendingStatus,
                pendingBy: t.pendingBy,
                pendingAt: t.pendingAt,
                updatedAt: t.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching pending ticker:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Update Breaking Ticker (Admin/Reporter)
export async function POST(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
        const body = await request.json();
        const { text, texts, enabled } = body;

        await db.collection('breaking_ticker').doc('main').set({
            text: text || texts?.[0] || '',
            texts: texts || [text].filter(Boolean) || [],
            active: enabled !== undefined ? enabled : true,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating pending ticker:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
