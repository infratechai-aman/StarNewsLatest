import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin, isSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    const db = getDb();
    if (!db) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    try {
        const docRef = db.collection('enewspapers').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'E-newspaper not found' }, { status: 404 });
        }

        const data = doc.data();
        const isAdmin = isSuperAdmin(authResult.user);

        // Enforce ownership: reporters can only delete their own e-newspapers
        if (!isAdmin && data.authorId && data.authorId !== authResult.user.userId) {
            return NextResponse.json({ error: 'Forbidden: You can only delete your own e-newspapers' }, { status: 403 });
        }

        await docRef.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reporter enewspaper DELETE error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
