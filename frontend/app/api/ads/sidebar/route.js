import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin';
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'
import { purgeCache } from '@/lib/cache'

let sidebarAdCache = { data: null, lastFetch: 0 };
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET() {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const doc = await db.collection('site_settings').doc('sidebar_ad').get()
        let responseData = { enabled: false, items: [] };

        if (doc.exists) {
            const data = doc.data()
            responseData = {
                enabled: data.enabled === false ? false : Boolean(data.enabled),
                items: data.items || []
            };
        }

        return NextResponse.json(responseData, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
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
        const updateData = {
            type: 'sidebar_ad',
            updatedAt: new Date().toISOString()
        }

        if (typeof body.enabled !== 'undefined') {
            updateData.enabled = Boolean(body.enabled)
        }
        if (typeof body.items !== 'undefined') {
            updateData.items = body.items
        }

        await db.collection('site_settings').doc('sidebar_ad').set(updateData, { merge: true })

        // Invalidate both module-level and shared caches
        sidebarAdCache = { data: null, lastFetch: 0 };
        purgeCache('sidebar');

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Ads Sidebar POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
