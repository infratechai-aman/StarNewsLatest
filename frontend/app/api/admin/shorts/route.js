import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';
export const dynamic = 'force-dynamic';

// GET: List Shorts (Admin)
export async function GET(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 503 });

    try {
        const snapshot = await db.collection('news_shorts').orderBy('createdAt', 'desc').get();
        const shorts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ shorts });
    } catch (error) {
        console.error('Error fetching admin shorts:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create Short/Reel (Admin)
export async function POST(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 503 });

    try {
        const body = await request.json();
        const { mediaType, mediaUrl, title, caption, active } = body;

        if (!mediaType || !mediaUrl) {
            return NextResponse.json({ error: 'Media Type and URL are required' }, { status: 400 });
        }

        if (title && title.length > 200) {
            return NextResponse.json({ error: 'Title must be under 200 characters' }, { status: 400 });
        }

        if (caption && caption.length > 2000) {
            return NextResponse.json({ error: 'Caption must be under 2000 characters' }, { status: 400 });
        }

        const newShort = {
            mediaType, // 'video' or 'image'
            mediaUrl,
            title: title || '',
            caption: caption || '',
            active: active !== false,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('news_shorts').add(newShort);
        await docRef.update({ id: docRef.id });

        // Invalidate public shorts cache so new short appears immediately
        purgeCache('public_shorts_reels_l');

        return NextResponse.json({ id: docRef.id, ...newShort });
    } catch (error) {
        console.error('Error creating short:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
