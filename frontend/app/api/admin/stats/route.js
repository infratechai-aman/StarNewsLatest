import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: Admin Dashboard Stats (with parallel queries + caching)
export async function GET(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
        // Check cache first
        const cacheKey = 'admin_stats';
        const cached = getCache(cacheKey);
        if (cached) return NextResponse.json(cached);

        // Run all count queries in parallel for better performance
        const [newsCount, usersCount, businessCount] = await Promise.all([
            db.collection('news_articles').count().get(),
            db.collection('users').count().get(),
            db.collection('businesses').count().get()
        ]);

        const stats = {
            totalNews: newsCount.data().count,
            totalUsers: usersCount.data().count,
            totalBusinesses: businessCount.data().count
        };

        // Cache for 2 minutes
        setCache(cacheKey, stats, 2 * 60 * 1000);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error.message);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
