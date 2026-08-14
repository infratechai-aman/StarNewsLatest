import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';


// POST: Toggle News Visibility (Admin)
export async function POST(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const newStatus = !doc.data().active;
        await docRef.update({ active: newStatus });
        purgeCache('news_');

        return NextResponse.json({ success: true, enabled: newStatus });
    } catch (error) {
        console.error('Error toggling admin news:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
