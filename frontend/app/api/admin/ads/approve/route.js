import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// POST: Approve or Reject Ad
export async function POST(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const body = await request.json();
        const { adId, action } = body;

        if (!adId || !action) {
            return NextResponse.json({ error: 'Ad ID and action are required' }, { status: 400 });
        }

        const docRef = db.collection('ads').doc(adId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        await docRef.update({
            approvalStatus: status,
            active: status === 'approved',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, status });
    } catch (error) {
        // console.error('Error approving ad:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
