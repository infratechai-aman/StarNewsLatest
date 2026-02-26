import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let businessCache = {
    data: null,
    lastFetch: 0
};
const CACHE_TTL = 60 * 1000; // 1 minute

// GET: List active businesses (Public)
export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            console.error('Firestore DB not initialized in Business API');
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
            .where('active', '==', true);

        if (category) {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        let businesses = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            enabled: doc.data().active // Map for frontend compatibility
        }));

        // Sort in memory to avoid index requirements
        businesses.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || 0;
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || 0;
            return dateB - dateA;
        });

        if (isDefaultQuery) {
            businessCache = {
                data: businesses,
                lastFetch: Date.now()
            };
        }

        return NextResponse.json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error, error.stack);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Not rewriting POST here as it was in another file or handled by admin route for creation mainly.
// However, looking at file list, businesses/route.js seems to be GET only (Public).
// Admin creation is in api/admin/businesses.
