import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

async function isSuperAdmin(token) {
    if (!token) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// POST: Approve/Reject Classified
export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { classifiedId, action } = body;

        const status = action === 'approve' ? 'approved' : 'rejected';
        const isActive = action === 'approve';

        await db.collection('classified_ads').doc(classifiedId).update({
            approvalStatus: status,
            active: isActive,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error approving classified:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
