import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// POST: Approve or Reject Business
export async function POST(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database service not available' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { businessId, action } = body;

        if (!businessId || !action) {
            return NextResponse.json({ error: 'Business ID and action are required' }, { status: 400 });
        }

        const cleanId = String(businessId).trim();
        let docRef = db.collection('businesses').doc(cleanId);
        let doc = await docRef.get();

        if (!doc.exists) {
            const querySnap = await db.collection('businesses').where('id', '==', cleanId).get();
            if (!querySnap.empty) {
                doc = querySnap.docs[0];
                docRef = querySnap.docs[0].ref;
            } else {
                return NextResponse.json({ error: 'Business not found' }, { status: 404 });
            }
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        await docRef.set({
            id: docRef.id,
            approvalStatus: status,
            active: status === 'approved',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Purge pending and public businesses caches
        purgeCache('admin_pending');
        purgeCache('businesses');
        purgeCache('admin_businesses_list');
        purgeCache('admin_stats');

        return NextResponse.json({ success: true, status, id: docRef.id });
    } catch (error) {
        console.error('Error approving business:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
