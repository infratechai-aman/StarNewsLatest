import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PUT: Reject a specific ticker change request by requestId
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
        const { requestId, reason } = body;

        if (!requestId) {
            return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
        }

        const reqRef = db.collection('ticker_change_requests').doc(requestId);
        const reqDoc = await reqRef.get();

        if (!reqDoc.exists) {
            return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
        }

        if (reqDoc.data().status !== 'pending') {
            return NextResponse.json({ error: 'This request has already been reviewed' }, { status: 409 });
        }

        const now = new Date().toISOString();
        const adminName = authResult.user.name || authResult.user.email || 'Admin';

        await reqRef.update({
            status: 'rejected',
            reviewedAt: now,
            reviewedBy: adminName,
            reviewNote: reason || null
        });

        // Live ticker is NOT changed on rejection
        // Also update the backward-compat pendingStatus on breaking_ticker/main
        await db.collection('breaking_ticker').doc('main').set({
            pendingStatus: 'rejected',
            updatedAt: now
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Ticker change request rejected. Live ticker unchanged.' });
    } catch (error) {
        console.error('Admin reject ticker error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
