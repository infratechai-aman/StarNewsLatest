import { getDb, getAuth } from '@/lib/firebaseAdmin';
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

        // Join all texts so multiple selected articles all appear in the ticker
        const allTexts = t.texts && t.texts.length > 0 ? t.texts : (t.text ? [t.text] : []);
        const joinedText = allTexts.filter(Boolean).join(' • ');

        return NextResponse.json({
            enabled: true,
            text: joinedText || t.text || '',
            texts: allTexts,
            updatedAt: t.updatedAt
        });
    } catch (error) {
        // console.error('Error fetching ticker:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Update Breaking Ticker
export async function POST(request) {
    try {
        const db = getDb();
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token || token === 'null' || token === 'undefined') {
            // console.error('[TickerAPI] No valid token provided in header');
            return NextResponse.json({ error: 'Auth token missing' }, { status: 401 });
        }

        const auth = getAuth();
        let decodedUser;
        try {
            decodedUser = await auth.verifyIdToken(token);
        } catch (authError) {
            // console.error('[TickerAPI] Token verification failed:', authError.message);
            // Return 401 instead of crashing or let it throw 500
            return NextResponse.json({
                error: 'Authentication failed: ' + authError.message,
                hint: 'Try logging out and logging in again'
            }, { status: 401 });
        }

        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;

        if (role !== 'super_admin' && role !== 'reporter') {
            // console.error(`[TickerAPI] Access denied for role: ${role}`);
            return NextResponse.json({ error: 'Unauthorized: Admin or Reporter role required' }, { status: 403 });
        }

        const body = await request.json();
        const { enabled, texts } = body;

        const updateData = {
            updatedAt: new Date().toISOString()
        };

        if (role === 'super_admin') {
            updateData.text = texts?.[0] || '';
            updateData.texts = texts || [];
            updateData.status = enabled ? 'active' : 'inactive';
        } else {
            // Reporter: only update pending fields
            updateData.pendingText = texts?.[0] || '';
            updateData.pendingStatus = 'pending';
        }

        await db.collection('breaking_ticker').doc('main').set(updateData, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        // console.error('[TickerAPI] POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
