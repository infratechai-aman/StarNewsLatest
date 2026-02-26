import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: List active Classifieds (Public)
export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json([]);
        }
        const snapshot = await db.collection('classified_ads')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();

        const ads = snapshot.docs.map(doc => doc.data());

        return NextResponse.json(ads);
    } catch (error) {
        console.error('Error fetching classifieds:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
