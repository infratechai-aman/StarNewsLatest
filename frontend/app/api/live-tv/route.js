import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Public endpoint - fetch live TV config
export async function GET() {
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

        return NextResponse.json({
            enabled: data.enabled !== false,
            streams: activeStreams,
            primaryStreamId: data.primaryStreamId || null
        });
    } catch (error) {
        console.error('Error fetching live TV config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
