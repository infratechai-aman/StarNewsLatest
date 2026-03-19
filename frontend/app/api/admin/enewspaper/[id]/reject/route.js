import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// PUT: Reject E-Newspaper
export async function PUT(request, { params }) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        const body = await request.json().catch(() => ({}));

        await db.collection('enewspapers').doc(id).update({
            approvalStatus: 'rejected',
            active: false,
            rejectionReason: body.reason || '',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, status: 'rejected' });
    } catch (error) {
        console.error('Error rejecting enewspaper:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
