import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// POST: Approve or Reject News
export async function POST(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
        const body = await request.json();
        const { articleId, action, reason } = body;

        if (!articleId || !action) {
            return NextResponse.json({ error: 'Article ID and action are required' }, { status: 400 });
        }

        const docRef = db.collection('news_articles').doc(articleId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        const updateData = {
            approvalStatus: status,
            active: status === 'approved' ? true : doc.data().active,
            adminResponse: reason || '',
            updatedAt: new Date().toISOString()
        };

        if (status === 'approved') {
            updateData.publishedAt = new Date().toISOString();
        }

        await docRef.update(updateData);
        purgeCache('news_');

        return NextResponse.json({ success: true, status });
    } catch (error) {
        console.error('Error approving news:', error.message);
        return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
    }
}
