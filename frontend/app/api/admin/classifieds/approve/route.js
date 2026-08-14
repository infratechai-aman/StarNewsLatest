import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// POST: Approve or Reject Classified
export async function POST(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const body = await request.json();
        const { classifiedId, action } = body;

        if (!classifiedId || !action) {
            return NextResponse.json({ error: 'Classified ID and action are required' }, { status: 400 });
        }

        const docRef = db.collection('classified_ads').doc(classifiedId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Classified not found' }, { status: 404 });
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        await docRef.update({
            approvalStatus: status,
            active: status === 'approved',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, status });
    } catch (error) {
        // console.error('Error approving classified:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
