import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// List Reporters (Admin only)
export async function GET(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ reporters: [] });

    // opt(PERF): Cache reporter list + stats for 5 minutes
    const CACHE_KEY = 'admin_reporters_with_stats';
    const cached = getCache(CACHE_KEY);
    if (cached) return NextResponse.json(cached);

    try {
        // 1. Fetch all reporter user accounts
        const snapshot = await db.collection('users')
            .where('role', '==', 'reporter')
            .get();

        const reporters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 2. Fetch all news articles submitted by reporters (single query, aggregate in-memory)
        // This is more efficient than N separate per-reporter queries.
        let newsSnapshot;
        try {
            newsSnapshot = await db.collection('news_articles')
                .where('approvalStatus', 'in', ['pending', 'approved', 'rejected'])
                .get();
        } catch {
            // If query fails (e.g. index not ready), fall back to full collection scan
            newsSnapshot = await db.collection('news_articles').get();
        }

        // Build per-authorId stats map
        const statsMap = {};
        for (const doc of newsSnapshot.docs) {
            const data = doc.data();
            const authorId = data.authorId;
            if (!authorId) continue;
            if (!statsMap[authorId]) {
                statsMap[authorId] = { total: 0, published: 0, pending: 0, rejected: 0 };
            }
            statsMap[authorId].total++;
            const status = data.approvalStatus;
            if (status === 'approved') statsMap[authorId].published++;
            else if (status === 'rejected') statsMap[authorId].rejected++;
            else statsMap[authorId].pending++;
        }

        // 3. Merge stats into reporter records
        const reportersWithStats = reporters.map(r => ({
            ...r,
            stats: statsMap[r.id] || { total: 0, published: 0, pending: 0, rejected: 0 }
        }));

        const result = { reporters: reportersWithStats };
        setCache(CACHE_KEY, result, 5 * 60 * 1000); // 5-min TTL
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching reporters:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
