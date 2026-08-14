import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// POST: Toggle E-Newspaper Active Status (Admin only, or Reporter?)
// Original code allowed admin.

export async function POST(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        const docRef = db.collection('enewspapers').doc(id);
        const doc = await docRef.get();

        if (doc.exists) {
            const newStatus = !doc.data().active;
            await docRef.update({ active: newStatus });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error toggling enewspaper:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
