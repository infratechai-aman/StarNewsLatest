import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: List active Classifieds (Public) with cursor-based pagination
export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ classifieds: [], total: 0, page: 1, totalPages: 0 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const category = searchParams.get('category') || '';
        const afterId = searchParams.get('after') || ''; // Cursor for efficient pagination

        // Build cache key based on params
        const cacheKey = `classifieds_p${page}_l${limit}_c${category}_a${afterId}`;
        const cachedData = getCache(cacheKey);
        if (cachedData) return NextResponse.json(cachedData);

        // Build query
        let query = db.collection('classified_ads')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true);

        if (category) {
            query = query.where('category', '==', category);
        }

        // fix(DEFECT-03): REMOVED expensive count query that fetched ALL documents.
        // Old code did `await query.get()` just to count total — reading every document!
        // Now using hasMore pattern: fetch limit+1 to check if more exist.

        // Cursor-based pagination: if we have an afterId, start after that document
        let paginatedQuery = query.orderBy('createdAt', 'desc');

        if (afterId) {
            // Cursor-based: start after the specified document
            const afterDoc = await db.collection('classified_ads').doc(afterId).get();
            if (afterDoc.exists) {
                paginatedQuery = paginatedQuery.startAfter(afterDoc);
            }
        } else if (page > 1) {
            // Fallback for page-based: fetch and skip (less efficient but backward compatible)
            const skipCount = (page - 1) * limit;
            const skipSnapshot = await paginatedQuery.limit(skipCount).get();
            if (skipSnapshot.docs.length > 0) {
                const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
                paginatedQuery = paginatedQuery.startAfter(lastDoc);
            }
        }

        const snapshot = await paginatedQuery.limit(limit + 1).get(); // Fetch 1 extra to check hasMore
        const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const hasMore = allDocs.length > limit;
        const paginatedAds = hasMore ? allDocs.slice(0, limit) : allDocs;

        const lastDoc = paginatedAds[paginatedAds.length - 1];

        const result = {
            classifieds: paginatedAds,
            total: paginatedAds.length, // Actual count of returned items
            page,
            limit,
            hasMore,
            // Return cursor for next page
            nextCursor: lastDoc?.id || null
        };

        // Cache for 3 minutes
        setCache(cacheKey, result, 3 * 60 * 1000);

        // fix(DEFECT-08): Add Cache-Control for browser/CDN caching
        const response = NextResponse.json(result);
        response.headers.set('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=60');
        return response;
    } catch (error) {
        console.error('Error fetching classifieds:', error.message);
        return NextResponse.json({ error: 'Failed to fetch classifieds' }, { status: 500 });
    }
}
