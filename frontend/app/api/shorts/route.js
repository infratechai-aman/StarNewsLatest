import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ shorts: [] });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        const cacheKey = `public_shorts_reels_l${limit}`;
        const cached = getCache(cacheKey);
        if (cached) return NextResponse.json(cached);

        // fix(DEFECT-09): Reduced from limit*3 to limit+10 — most shorts are active, no need for 3x buffer
        const snapshot = await db.collection('news_shorts')
            .orderBy('createdAt', 'desc')
            .limit(limit + 10) // Small buffer for inactive ones
            .get();

        const allShorts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const shorts = allShorts.filter(short => short.active !== false).slice(0, limit);

        setCache(cacheKey, { shorts }, 2 * 60 * 1000); // Cache for 2 mins

        // fix(DEFECT-08): Add Cache-Control for browser/CDN caching
        const response = NextResponse.json({ shorts });
        response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
        return response;
    } catch (error) {
        console.error('Error fetching shorts:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
