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

        // fix(P1-DB-01): count() is a Firestore billing-tier API — fails on Spark/free plan.
        // Use select() to fetch only doc IDs (no field data), then count .size.
        // This works on ALL Firestore plans.
        const [newsSnap, usersSnap, businessSnap] = await Promise.all([
            db.collection('news_articles').select().get(),
            db.collection('users').select().get(),
            db.collection('businesses').select().get()
        ]);

        const stats = {
            totalNews: newsSnap.size,
            totalUsers: usersSnap.size,
            totalBusinesses: businessSnap.size
        };

        // Cache for 2 minutes
        setCache(cacheKey, stats, 2 * 60 * 1000);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error.message);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
