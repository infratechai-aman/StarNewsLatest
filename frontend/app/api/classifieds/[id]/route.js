import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch a single classified ad by ID (Public)
export async function GET(request, { params }) {
    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const id = params.id;
        const doc = await db.collection('classified_ads').doc(id).get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Classified not found' }, { status: 404 });
        }

        const data = doc.data();

        // Only return if approved and active
        if (data.approvalStatus !== 'approved' || data.active === false) {
            return NextResponse.json({ error: 'Classified not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: doc.id,
            ...data
        });
    } catch (error) {
        console.error('Error fetching classified:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
