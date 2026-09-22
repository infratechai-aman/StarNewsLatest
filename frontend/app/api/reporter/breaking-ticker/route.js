import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin, isSuperAdmin } from '@/lib/auth';
import { purgeCache } from '@/lib/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch current live ticker + THIS reporter's own change request history (isolated per reporter)
export async function GET(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ ticker: null, myRequests: [] }, { status: 503 });
        }

        // 1. Fetch the current live ticker
        const liveDoc = await db.collection('breaking_ticker').doc('main').get();
        const liveData = liveDoc.exists ? liveDoc.data() : null;
        const liveTicker = liveData ? {
            text: liveData.text || '',
            enabled: liveData.enabled !== false,
            status: liveData.status || 'inactive',
            updatedAt: liveData.updatedAt || null
        } : null;

        // 2. Fetch ONLY this reporter's change requests (strict per-reporter isolation)
        const reporterId = authResult.user.userId;
        let myRequests = [];
        try {
            const reqSnapshot = await db.collection('ticker_change_requests')
                .where('reporterId', '==', reporterId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            myRequests = reqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexErr) {
            // Fallback if index not yet built: in-memory filter
            const allSnap = await db.collection('ticker_change_requests')
                .where('reporterId', '==', reporterId)
                .get();
            myRequests = allSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 20);
        }

        // 3. Find any currently-pending request by this reporter
        const pendingRequest = myRequests.find(r => r.status === 'pending') || null;

        return NextResponse.json({
            liveTicker,
            myRequests,
            pendingRequest
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });

    } catch (error) {
        console.error('Reporter breaking ticker GET error:', error);
        return NextResponse.json({ liveTicker: null, myRequests: [], error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Submit a ticker change request (for reporters) or go live immediately (for admins)
export async function POST(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) {
        return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const proposedText = (body.text || body.pendingText || '').trim();

        if (!proposedText) {
            return NextResponse.json({ success: false, error: 'Ticker text is required' }, { status: 400 });
        }

        if (proposedText.length > 500) {
            return NextResponse.json({ success: false, error: 'Ticker text must be under 500 characters' }, { status: 400 });
        }

        // Fetch current live ticker text for context (to store "previous" in the change request)
        let previousTickerText = '';
        try {
            const liveDoc = await db.collection('breaking_ticker').doc('main').get();
            if (liveDoc.exists) {
                previousTickerText = liveDoc.data().text || '';
            }
        } catch {
            previousTickerText = '';
        }

        const isAdmin = isSuperAdmin(authResult.user);

        if (isAdmin) {
            // Admin: update live ticker directly and immediately
            const updateData = {
                text: proposedText,
                texts: proposedText.includes('•') ? proposedText.split('•').map(t => t.trim()).filter(Boolean) : [proposedText],
                enabled: true,
                status: 'active',
                updatedAt: new Date().toISOString(),
                // Clear any stale pendingText since admin published directly
                pendingText: '',
                pendingStatus: null
            };
            await db.collection('breaking_ticker').doc('main').set(updateData, { merge: true });
            purgeCache('api_breaking_ticker');
            purgeCache('breaking_ticker');

            return NextResponse.json({ success: true, status: 'published' });
        } else {
            // Reporter: create a change request document in the new collection (isolated per reporter)
            const now = new Date().toISOString();
            const changeRequest = {
                reporterId: authResult.user.userId,
                reporterName: authResult.user.name || authResult.user.email || '',
                reporterEmail: authResult.user.email || '',
                previousTickerText,
                proposedTickerText: proposedText,
                status: 'pending',
                createdAt: now,
                reviewedAt: null,
                reviewedBy: null,
                reviewNote: null
            };

            const docRef = await db.collection('ticker_change_requests').add(changeRequest);

            return NextResponse.json({
                success: true,
                status: 'pending_review',
                requestId: docRef.id,
                message: 'Your headline has been submitted for Admin approval. It will go live once approved.'
            });
        }
    } catch (error) {
        console.error('Reporter breaking ticker POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
