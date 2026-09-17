import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache, purgeCache } from '@/lib/cache';

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

        let allDocs = [];
        try {
            const snapshot = await paginatedQuery.limit(limit + 1).get(); // Fetch 1 extra to check hasMore
            allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexErr) {
            console.warn('Classifieds query orderBy failed (likely missing index), falling back to in-memory sort:', indexErr.message);
            const fallbackSnap = await query.limit(limit * 2).get();
            allDocs = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allDocs.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || 0;
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || 0;
                return dateB - dateA;
            });
        }
        
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

// POST: Create / Submit Classified Ad (Public or Authenticated)
export async function POST(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    try {
        const body = await request.json();
        const { title, description, category, price, contactName, contactPhone, phone, contactEmail, location, images } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const phoneVal = (phone || contactPhone || '').trim();
        const imageList = Array.isArray(images) ? images.slice(0, 8) : (images ? [images] : []);

        const newAd = {
            title: title.trim(),
            description: (description || '').slice(0, 5000),
            category: (category || 'Other').slice(0, 100),
            price: price || 'Price on Request',
            contactName: (contactName || '').slice(0, 100),
            contactPhone: phoneVal,
            phone: phoneVal,
            contactEmail: (contactEmail || '').slice(0, 100),
            location: (location || '').slice(0, 200),
            images: imageList,
            image: imageList[0] || '',
            approvalStatus: 'pending',
            active: false,
            userId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('classified_ads').add(newAd);
        await docRef.update({ id: docRef.id });

        // Purge pending and public classified caches
        purgeCache('admin_pending');
        purgeCache('classifieds');

        return NextResponse.json({ id: docRef.id, ...newAd });
    } catch (error) {
        console.error('Error in classifieds POST:', error);
        return NextResponse.json({ error: 'Failed to submit classified' }, { status: 500 });
    }
}
