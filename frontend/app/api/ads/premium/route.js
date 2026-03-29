import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'
import { getCache, setCache, purgeCache } from '@/lib/cache'

export async function GET() {
    const CACHE_KEY = 'api_ads_premium';
    const cachedData = getCache(CACHE_KEY);

    if (cachedData) {
        return NextResponse.json(cachedData, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
        });
    }

    const db = getDb();
    if (!db) {
        return NextResponse.json({ enabled: false, imageUrl: '', linkUrl: '', title: '' });
    }
    try {

        const doc = await db.collection('site_settings').doc('premium_ad').get()
        let responseData = { enabled: false, imageUrl: '', linkUrl: '', title: '' };

        if (doc.exists) {
            const data = doc.data()
            responseData = {
                enabled: data.enabled,
                imageUrl: data.imageUrl || '',
                linkUrl: data.linkUrl || '',
                title: data.title || ''
            };
        }

        setCache(CACHE_KEY, responseData, 60 * 1000); // 1 minute TTL

        return NextResponse.json(responseData, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
        });
    } catch (error) {
        console.error('Ads Premium GET Error:', error)
        return NextResponse.json({ enabled: false, imageUrl: '', linkUrl: '', title: '' })
    }
}

export async function POST(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const user = await getCurrentUser(request)
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { enabled, imageUrl, linkUrl, title } = body

        await db.collection('site_settings').doc('premium_ad').set({
            type: 'premium_ad',
            imageUrl,
            linkUrl,
            title,
            enabled: enabled !== false,
            updatedAt: new Date().toISOString()
        }, { merge: true })

        // Invalidate cache so next GET returns fresh data
        purgeCache('premium');

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Ads Premium POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
