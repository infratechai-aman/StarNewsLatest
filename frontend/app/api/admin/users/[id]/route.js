import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// PUT: Update User (Admin)
export async function PUT(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete User (Admin)
export async function DELETE(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
