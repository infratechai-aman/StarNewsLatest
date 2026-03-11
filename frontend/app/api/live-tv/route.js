import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: Public endpoint - fetch live TV config
export async function GET() {
    const CACHE_KEY = 'api_live_tv_config';
    const cachedData = getCache(CACHE_KEY);
    if (cachedData) return NextResponse.json(cachedData);

    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ enabled: false, streams: [], primaryStreamId: null });
        }

        const doc = await db.collection('settings').doc('live_tv_config').get();

        if (!doc.exists) {
            return NextResponse.json({ enabled: false, streams: [], primaryStreamId: null });
        }

        const data = doc.data();

        // Only return active streams to the public
        const activeStreams = (data.streams || []).filter(s => s.isActive !== false);

        const responseData = {
            enabled: data.enabled !== false,
            streams: activeStreams,
            primaryStreamId: data.primaryStreamId || null
        };

        setCache(CACHE_KEY, responseData, 5 * 60 * 1000); // 5 minutes cache
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching live TV config:', error);
        return NextResponse.json({ enabled: false, streams: [], primaryStreamId: null });
    }
}
