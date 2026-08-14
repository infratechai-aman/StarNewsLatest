import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// List Reporters (Admin only)
export async function GET(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ reporters: [] });

    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'reporter')
            .get();

        const reporters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ reporters });
    } catch (error) {
        console.error('Error fetching reporters:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
