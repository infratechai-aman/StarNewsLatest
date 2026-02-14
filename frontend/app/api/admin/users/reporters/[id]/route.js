import { auth, db } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Delete Reporter (Admin)
export async function DELETE(request, { params }) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const decodedAdmin = await auth.verifyIdToken(token);
        const adminDoc = await db.collection('users').doc(decodedAdmin.uid).get();

        if (!adminDoc.exists || adminDoc.data().role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const reporterId = params.id;

        // 1. Delete from Firebase Auth
        await auth.deleteUser(reporterId);

        // 2. Delete from Firestore
        await db.collection('users').doc(reporterId).delete();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting reporter:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
