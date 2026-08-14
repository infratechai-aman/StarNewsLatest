import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// PUT: Approve Pending Ticker
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

        const data = doc.data();
        if (!data.pendingText) {
            return NextResponse.json({ error: 'No pending text to approve' }, { status: 400 });
        }

        await docRef.update({
            text: data.pendingText,
            pendingText: '',
            pendingStatus: 'approved',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // console.error('Error approving ticker:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
