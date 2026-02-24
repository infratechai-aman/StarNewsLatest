import { db } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let businessCache = {
    data: null,
    lastFetch: 0
};
const CACHE_TTL = 60 * 1000; // 1 minute

// GET: List active businesses (Public)
export async function GET(request) {
    try {
        if (!db) {
            return NextResponse.json([]);
        }
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const isDefaultQuery = !category;

        if (isDefaultQuery && businessCache.data && (Date.now() - businessCache.lastFetch < CACHE_TTL)) {
            return NextResponse.json(businessCache.data);
        }

        let query = db.collection('businesses')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc');

        if (category) {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        const businesses = snapshot.docs.map(doc => ({
            ...doc.data(),
            enabled: doc.data().active // Map for frontend compatibility
        }));

        if (isDefaultQuery) {
            businessCache = {
                data: businesses,
                lastFetch: Date.now()
            };
        }

        return NextResponse.json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Not rewriting POST here as it was in another file or handled by admin route for creation mainly.
// However, looking at file list, businesses/route.js seems to be GET only (Public).
// Admin creation is in api/admin/businesses.
