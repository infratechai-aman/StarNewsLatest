import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';


// POST: Toggle Business Status
export async function POST(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        const docRef = db.collection('businesses').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const newStatus = !doc.data().active;
        await docRef.update({ active: newStatus });

        return NextResponse.json({ success: true, enabled: newStatus });
    } catch (error) {
        console.error('Error toggling business:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
