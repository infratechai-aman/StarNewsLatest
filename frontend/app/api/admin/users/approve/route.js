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

// POST: Approve or Activate User
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, action } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
        }

        const docRef = db.collection('users').doc(userId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const status = action === 'approve' ? 'active' : 'inactive';
        await docRef.update({
            status: status,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, status });
    } catch (error) {
        // console.error('Error approving user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
