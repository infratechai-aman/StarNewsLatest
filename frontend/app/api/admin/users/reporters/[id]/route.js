import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// DELETE: Delete Reporter (Admin)
export async function DELETE(request, { params }) {
    const db = getDb();
    const auth = getAuth();

    if (!db || !auth) {
        return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });

        let decodedUser;
        try {
            decodedUser = await auth.verifyIdToken(token);
        } catch (tokenError) {
            console.error('Token verification failed:', tokenError.code, tokenError.message);
            return NextResponse.json({
                error: 'Invalid authentication token. Please log out, log back in, and try again.',
                code: tokenError.code
            }, { status: 401 });
        }

        const adminDoc = await db.collection('users').doc(decodedUser.uid).get();
        if (!adminDoc.exists || adminDoc.data().role !== 'super_admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const id = params.id;

        // Check if user is actually a reporter
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists || userDoc.data().role !== 'reporter') {
            return NextResponse.json({ error: 'User is not a reporter' }, { status: 400 });
        }

        // 1. Delete from Firestore
        await db.collection('users').doc(id).delete();

        // 2. Delete from Firebase Auth
        try {
            await auth.deleteUser(id);
        } catch (authErr) {
            console.warn('Reporter deleted from DB but failed in Auth:', authErr.message);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting reporter:', error);
        return NextResponse.json({ error: error.message, code: error.code || 'UNKNOWN' }, { status: 500 });
    }
}

