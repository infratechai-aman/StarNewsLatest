import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { purgeCache } from '@/lib/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PUT: Approve a specific ticker change request by requestId
export async function PUT(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { requestId } = body;

        if (!requestId) {
            return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
        }

        const reqRef = db.collection('ticker_change_requests').doc(requestId);
        const reqDoc = await reqRef.get();

        if (!reqDoc.exists) {
            return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
        }

        const reqData = reqDoc.data();

        if (reqData.status !== 'pending') {
            return NextResponse.json({ error: 'This request has already been reviewed' }, { status: 409 });
        }

        const proposedText = reqData.proposedTickerText || '';
        if (!proposedText) {
            return NextResponse.json({ error: 'Proposed ticker text is empty' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const adminName = authResult.user.name || authResult.user.email || 'Admin';

        // Approve in ticker_change_requests
        await reqRef.update({
            status: 'approved',
            reviewedAt: now,
            reviewedBy: adminName,
            reviewNote: null
        });

        // Push to live ticker
        const liveUpdate = {
            text: proposedText,
            texts: proposedText.includes('•')
                ? proposedText.split('•').map(t => t.trim()).filter(Boolean)
                : [proposedText],
            enabled: true,
            status: 'active',
            updatedAt: now,
            // Clear stale pending fields for backward compat
            pendingText: '',
            pendingStatus: 'approved',
            pendingBy: reqData.reporterId || null,
            pendingByName: reqData.reporterName || null
        };
        await db.collection('breaking_ticker').doc('main').set(liveUpdate, { merge: true });

        // Invalidate caches immediately so site-wide ticker updates
        purgeCache('api_breaking_ticker');
        purgeCache('breaking_ticker');

        return NextResponse.json({
            success: true,
            message: `Ticker approved and live. Proposed by: ${reqData.reporterName || reqData.reporterEmail || 'Reporter'}`
        });
    } catch (error) {
        console.error('Admin approve ticker error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
