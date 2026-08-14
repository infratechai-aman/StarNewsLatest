import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: List active businesses (Public) with pagination
export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            console.error('Firestore DB not initialized in Business API');
            return NextResponse.json([]);
        }
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

        // Build cache key
        const cacheKey = `businesses_c${category || 'all'}_p${page}_l${limit}`;
        const cached = getCache(cacheKey);
        if (cached) return NextResponse.json(cached);

        let query = db.collection('businesses')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true);

        if (category) {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.limit(limit).get();
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

        // Cache for 1 minute
        setCache(cacheKey, businesses, 60 * 1000);

        return NextResponse.json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error.message);
        return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
    }
}
