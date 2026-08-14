import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 503 });

    try {
        const { id } = params;
        const body = await request.json();
        const { active } = body;

        await db.collection('news_shorts').doc(id).update({
            active: active !== false,
            updatedAt: new Date().toISOString()
        });

        // Invalidate public shorts cache so users see updated active state immediately
        purgeCache('public_shorts_reels_l');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error toggling short:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
