import { NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/firebaseAdmin';

export async function GET(request) {
    const auth = getAuth();
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
        return NextResponse.json({
            ticker: null,
            error: error.message,
            code: error.code
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const auth = getAuth();
        if (!db) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 503 });
        }

        const body = await request.json();
        const { text } = body;

        if (!text || !text.trim()) {
            return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
        }

        const texts = text.includes('•') ? text.split('•').map(t => t.trim()).filter(t => t) : [text.trim()];

        // Check role (need to add auth verify here or trust middleware if any)
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        const decodedUser = token ? await (async () => { try { return await auth.verifyIdToken(token); } catch (e) { return null; } })() : null;
        let role = 'reporter'; // Default for this endpoint
        if (decodedUser) {
            const userDoc = await db.collection('users').doc(decodedUser.uid).get();
            role = userDoc.exists ? userDoc.data().role : 'reporter';
        }

        const updateData = {
            updatedAt: new Date().toISOString()
        };

        if (role === 'super_admin') {
            updateData.text = text.trim();
            updateData.texts = texts;
            updateData.enabled = true;
            updateData.status = 'active';
        } else {
            updateData.pendingText = text.trim();
            updateData.pendingStatus = 'pending';
        }

        await db.collection('breaking_ticker').doc('main').set(updateData, { merge: true });

        return NextResponse.json({ success: true, ticker: updateData });
    } catch (error) {
        console.error('Reporter breaking ticker PUT error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code
        }, { status: 500 });
    }
}
