import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all pending ticker change requests (Admin only)
export async function GET(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    try {
        // 1. Fetch current live ticker
        const liveDoc = await db.collection('breaking_ticker').doc('main').get();
        const liveTicker = liveDoc.exists ? {
            text: liveDoc.data().text || '',
            status: liveDoc.data().status || 'inactive',
            enabled: liveDoc.data().enabled !== false,
            updatedAt: liveDoc.data().updatedAt || null
        } : null;

        // 2. Fetch all pending change requests (ordered by submission time, newest first)
        let pendingRequests = [];
        let recentRequests = [];
        try {
            const pendingSnap = await db.collection('ticker_change_requests')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .get();
            pendingRequests = pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const recentSnap = await db.collection('ticker_change_requests')
                .orderBy('createdAt', 'desc')
                .limit(30)
                .get();
            recentRequests = recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexErr) {
            // Fallback if Firestore index not built yet
            const allSnap = await db.collection('ticker_change_requests').get();
            const allRequests = allSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            pendingRequests = allRequests.filter(r => r.status === 'pending');
            recentRequests = allRequests.slice(0, 30);
        }

        return NextResponse.json({
            liveTicker,
            pendingRequests,
            recentRequests,
            pendingCount: pendingRequests.length
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });

    } catch (error) {
        console.error('Admin pending-ticker GET error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
