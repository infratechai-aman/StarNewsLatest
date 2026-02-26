import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// List Reporters (Admin)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();

    if (!db || !auth) {
        return NextResponse.json({ reporters: [] });
    }

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });

        let decodedAdmin;
        try {
            decodedAdmin = await auth.verifyIdToken(token);
        } catch (tokenError) {
            console.error('Token verification failed:', tokenError.code, tokenError.message);
            return NextResponse.json({
                error: 'Invalid authentication token. Please log out, log back in, and try again.',
                code: tokenError.code
            }, { status: 401 });
        }

        const adminDoc = await db.collection('users').doc(decodedAdmin.uid).get();

        if (!adminDoc.exists || adminDoc.data().role !== 'super_admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const snapshot = await db.collection('users')
            .where('role', '==', 'reporter')
            .get();

        const reporters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ reporters });
    } catch (error) {
        console.error('Error fetching reporters:', error);
        return NextResponse.json({ error: error.message, code: error.code || 'UNKNOWN' }, { status: 500 });
    }
}
