import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// GET: List all Users (Admin)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();

        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(users);
    } catch (error) {
        // console.error('Error fetching admin users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
