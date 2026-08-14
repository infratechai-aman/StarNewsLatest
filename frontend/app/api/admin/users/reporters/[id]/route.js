import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// DELETE: Delete Reporter (Admin only)
export async function DELETE(request, { params }) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    const auth = getAuth();

    if (!db || !auth) {
        return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    try {
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
        console.error('Error deleting reporter:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
