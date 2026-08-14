import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// POST: Toggle Classified Status (Admin)
export async function POST(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        const docRef = db.collection('classified_ads').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Classified not found' }, { status: 404 });
        }

        const newStatus = !doc.data().active;
        await docRef.update({ active: newStatus });

        return NextResponse.json({ success: true, enabled: newStatus });
    } catch (error) {
        console.error('Error toggling admin classified:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
