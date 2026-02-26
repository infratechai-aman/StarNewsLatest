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

// PUT: Update User (Admin)
export async function PUT(request, { params }) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        const body = await request.json();

        const docRef = db.collection('users').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData = { ...body, updatedAt: new Date().toISOString() };
        delete updateData.id;
        delete updateData.createdAt;

        await docRef.update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating admin user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete User (Admin)
export async function DELETE(request, { params }) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;

        // 1. Delete from Firestore
        await db.collection('users').doc(id).delete();

        // 2. Delete from Firebase Auth
        try {
            await auth.deleteUser(id);
        } catch (authErr) {
            console.warn('User deleted from DB but failed in Auth (user might not exist in Auth):', authErr.message);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
