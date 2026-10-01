import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'
import { getCache, setCache, purgeCache } from '@/lib/cache'

export async function GET() {
    const CACHE_KEY = 'site_settings_premium_ad';
    const cached = getCache(CACHE_KEY);
    if (cached) {
        return NextResponse.json(cached, {
            headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
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
            const isExplicitlyDisabled = data.enabled === false;
            responseData = {
                enabled: isExplicitlyDisabled ? false : Boolean(data.enabled && data.imageUrl),
                imageUrl: data.imageUrl || '',
                linkUrl: data.linkUrl || '',
                title: data.title || ''
            };
        }

        setCache(CACHE_KEY, responseData, 5 * 60 * 1000);

        return NextResponse.json(responseData, {
            headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
        });
    } catch (error) {
        console.error('Ads Premium GET Error:', error)
        return NextResponse.json({ enabled: false, imageUrl: '', linkUrl: '', title: '' });
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
        const updateData = {
            type: 'premium_ad',
            updatedAt: new Date().toISOString()
        }

        if (typeof body.enabled !== 'undefined') {
            updateData.enabled = Boolean(body.enabled)
        }
        if (typeof body.imageUrl !== 'undefined') updateData.imageUrl = body.imageUrl
        if (typeof body.linkUrl !== 'undefined') updateData.linkUrl = body.linkUrl
        if (typeof body.title !== 'undefined') updateData.title = body.title

        await db.collection('site_settings').doc('premium_ad').set(updateData, { merge: true })

        // Invalidate cache so next GET returns fresh data
        purgeCache('premium');

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Ads Premium POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
