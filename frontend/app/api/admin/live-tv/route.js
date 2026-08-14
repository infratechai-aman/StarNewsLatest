import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// GET: Fetch full live TV config (admin - includes inactive streams)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const doc = await db.collection('settings').doc('live_tv_config').get();

        if (!doc.exists) {
            return NextResponse.json({
                enabled: false,
                streams: [],
                primaryStreamId: null
            });
        }

        return NextResponse.json(doc.data());
    } catch (error) {
        console.error('Error fetching live TV config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update live TV config
export async function PUT(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const body = await request.json();

        // Validate stream limits
        if (body.streams && body.streams.length > 20) {
            return NextResponse.json({ error: 'Maximum 20 streams allowed' }, { status: 400 });
        }

        // Validate each stream URL is a valid YouTube URL
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        for (const stream of (body.streams || [])) {
            if (stream.title && stream.title.length > 100) {
                return NextResponse.json({ error: 'Stream title must be under 100 characters' }, { status: 400 });
            }
            if (stream.url && !youtubeRegex.test(stream.url)) {
                return NextResponse.json({ error: `Invalid YouTube URL: "${stream.url}". Only YouTube URLs are supported.` }, { status: 400 });
            }
        }

        // Validate the config structure
        const config = {
            enabled: body.enabled !== false,
            streams: (body.streams || []).map(stream => ({
                id: stream.id || crypto.randomUUID(),
                title: stream.title || 'Untitled Stream',
                url: stream.url || '',
                isLive: stream.isLive || false,
                isActive: stream.isActive !== false,
                order: stream.order || 0,
                addedAt: stream.addedAt || new Date().toISOString()
            })),
            primaryStreamId: body.primaryStreamId || null,
            updatedAt: new Date().toISOString()
        };

        await db.collection('settings').doc('live_tv_config').set(config, { merge: false });

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error('Error updating live TV config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
