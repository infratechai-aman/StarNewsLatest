import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// PUT: Update/Edit a Short
export async function PUT(request, { params }) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 503 });

    try {
        const { id } = params;
        const body = await request.json();
        const { title, caption, mediaUrl, mediaType, active } = body;

        if (!mediaUrl || !mediaType) {
            return NextResponse.json({ error: 'Media URL and type are required' }, { status: 400 });
        }

        const updates = {
            title: title || '',
            caption: caption || '',
            mediaUrl,
            mediaType,
            active: active !== false,
            updatedAt: new Date().toISOString(),
        };

        await db.collection('news_shorts').doc(id).update(updates);

        // Invalidate public cache
        purgeCache('public_shorts_reels_l');

        return NextResponse.json({ success: true, id, ...updates });
    } catch (error) {
        console.error('Error updating short:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove a Short
export async function DELETE(request, { params }) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 503 });

    try {
        const { id } = params;
        await db.collection('news_shorts').doc(id).delete();

        // Invalidate public cache so deleted short is removed immediately
        purgeCache('public_shorts_reels_l');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting short:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
