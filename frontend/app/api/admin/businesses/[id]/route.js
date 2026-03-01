import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

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

// PUT: Update Business
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

        const updateData = { ...body, updatedAt: new Date().toISOString() };
        delete updateData.id;
        delete updateData.createdAt;

        await db.collection('businesses').doc(id).update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating business:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete Business
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
        await db.collection('businesses').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting business:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
