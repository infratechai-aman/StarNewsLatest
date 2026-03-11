import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: List active E-Newspapers (Public)
export async function GET(request) {
    const CACHE_KEY = 'api_enewspaper_active';
    const cachedData = getCache(CACHE_KEY);
    if (cachedData) return NextResponse.json(cachedData);

    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ papers: [] });
        }

        let papers = [];
        try {
            // Try with ordering (requires composite index)
            const snapshot = await db.collection('enewspapers')
                .where('active', '==', true)
                .orderBy('publishDate', 'desc')
                .get();
            papers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (indexError) {
            // Fallback: fetch without ordering if composite index missing
            console.warn('enewspaper index missing, fetching without order:', indexError.message);
            const snapshot = await db.collection('enewspapers')
                .where('active', '==', true)
                .get();
            papers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Sort in JS
            papers.sort((a, b) => new Date(b.publishDate || 0) - new Date(a.publishDate || 0));
        }
        const responseData = { papers };
        setCache(CACHE_KEY, responseData, 10 * 60 * 1000); // Cache for 10 minutes (these change rarely)
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching enewspapers:', error);
        // Return empty instead of 500 so page still renders
        return NextResponse.json({ papers: [] });
    }
}
