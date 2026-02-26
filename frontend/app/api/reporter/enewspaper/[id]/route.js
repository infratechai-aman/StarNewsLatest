import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    const { id } = params;
    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        await auth.verifyIdToken(token);
        // Simplification: reporter/admin can delete from this endpoint

        await db.collection('enewspapers').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
