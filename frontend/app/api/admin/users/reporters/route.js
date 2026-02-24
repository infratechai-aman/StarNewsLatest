import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// List Reporters (Admin)
export async function GET(request) {
    try {
        if (!db || !auth) {
            return NextResponse.json({ reporters: [] });
        }
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const decodedAdmin = await auth.verifyIdToken(token);
        const adminDoc = await db.collection('users').doc(decodedAdmin.uid).get();

        if (!adminDoc.exists || adminDoc.data().role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
