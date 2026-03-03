import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin';
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

let sidebarAdCache = { data: null, lastFetch: 0 };
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET() {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        if (sidebarAdCache.data && (Date.now() - sidebarAdCache.lastFetch < CACHE_TTL)) {
            return NextResponse.json(sidebarAdCache.data, {
                headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
            });
        }

        const doc = await db.collection('site_settings').doc('sidebar_ad').get()
        let responseData = { enabled: false, items: [] };

        if (doc.exists) {
            const data = doc.data()
            responseData = {
                enabled: data.enabled,
                items: data.items || []
            };
        }

        sidebarAdCache = { data: responseData, lastFetch: Date.now() };

        return NextResponse.json(responseData, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
        });
    } catch (error) {
        console.error('Ads Sidebar GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    const db = getDb();
    try {
        const user = await getCurrentUser(request)
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { enabled, items } = body

        await db.collection('site_settings').doc('sidebar_ad').set({
            type: 'sidebar_ad',
            items: items || [],
            enabled: enabled !== false,
            updatedAt: new Date().toISOString()
        }, { merge: true })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Ads Sidebar POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
