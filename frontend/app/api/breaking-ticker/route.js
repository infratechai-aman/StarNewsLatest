import { getDb, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Breaking Ticker
export async function GET(request) {
    try {
        const db = getDb();
        if (!db) {
            return NextResponse.json({ enabled: false, text: '', texts: [] });
        }
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

// POST: Update Breaking Ticker
export async function POST(request) {
    try {
        const db = getDb();
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;

        if (role !== 'super_admin' && role !== 'reporter') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { enabled, texts } = body;

        await db.collection('breaking_ticker').doc('main').set({
            text: texts?.[0] || '',
            texts: texts || [],
            status: enabled ? 'active' : 'inactive',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating ticker:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
