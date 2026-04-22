import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin';
import { getCache, setCache } from '@/lib/cache';

const CACHE_KEY = 'categories_all';

// GET: List active categories (Public)
export async function GET() {
    const db = getDb();
    try {
        // Check cache first
        const cachedData = getCache(CACHE_KEY);
        if (cachedData) return NextResponse.json(cachedData);

        const snapshot = await db.collection('news_categories')
            .where('active', '==', true)
            .get()

        let categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Sort in memory to avoid needing a Firestore Composite Index
        categories.sort((a, b) => a.name.localeCompare(b.name));

        // Cache for 5 minutes (categories rarely change)
        setCache(CACHE_KEY, categories, 5 * 60 * 1000);

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Categories GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
