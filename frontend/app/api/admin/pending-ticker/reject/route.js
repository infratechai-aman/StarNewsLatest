import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// PUT: Reject Pending Ticker
export async function PUT(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const docRef = db.collection('breaking_ticker').doc('main');
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Ticker not found' }, { status: 404 });
        }

        await docRef.update({
            pendingText: '',
            pendingStatus: 'rejected',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // console.error('Error rejecting ticker:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
