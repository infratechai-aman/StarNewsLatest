import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// GET: Admin Pending Ticker (For Review)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        // Removed Auth Check temporarily or keep strict?
        // Old code had "EMERGENCY: Auth disabled" commented out.
        // We will keep strict check but allow Reporters too if needed.
        // For now, restrict to Admin/Reporter.

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;

        if (role !== 'super_admin' && role !== 'reporter') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const doc = await db.collection('breaking_ticker').doc('main').get();

        // If no main doc, return null
        if (!doc.exists) {
            return NextResponse.json({ ticker: null });
        }

        const t = doc.data();

        // Return only relevant fields
        // Note: Firestore structure might differ from SQL.
        // We'll return the whole object as "ticker"
        return NextResponse.json({
            ticker: {
                text: t.text,
                pendingText: t.pendingText,
                pendingStatus: t.pendingStatus, // 'pending' or 'approved'
                updatedAt: t.updatedAt
            }
        });

    } catch (error) {
        // console.error('Error fetching pending ticker:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// POST: Update Breaking Ticker (Admin/Reporter)
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();
    try {
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
        const { text, texts, enabled } = body;

        await db.collection('breaking_ticker').doc('main').set({
            text: text || texts?.[0] || '',
            texts: texts || [text].filter(Boolean) || [],
            active: enabled !== undefined ? enabled : true,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        // console.error('Error updating pending ticker:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
