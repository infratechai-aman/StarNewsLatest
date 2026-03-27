import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'classifieds_all';

// GET: List active Classifieds (Public)
export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json([]);
        }

        // Check cache first
        const cachedData = getCache(CACHE_KEY);
        if (cachedData) return NextResponse.json(cachedData);

        const snapshot = await db.collection('classified_ads')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();

        const ads = snapshot.docs.map(doc => doc.data());

        // Cache for 5 minutes
        setCache(CACHE_KEY, ads, 5 * 60 * 1000);

        return NextResponse.json(ads);
    } catch (error) {
        console.error('Error fetching classifieds:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
