import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';


// PUT: Update Business
export async function PUT(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete Business
export async function DELETE(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        await db.collection('businesses').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting business:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
