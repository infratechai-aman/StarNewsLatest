import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

// PUT: Approve Pending Ticker
export async function PUT(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
