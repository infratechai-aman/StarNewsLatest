import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

async function isSuperAdmin(token) {
    if (!token) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// DELETE: Delete Classified
export async function DELETE(request, { params }) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        await db.collection('classified_ads').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting classified:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
