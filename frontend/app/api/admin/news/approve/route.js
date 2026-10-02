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
    if (!db) {
        return NextResponse.json({ error: 'Database service not available' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { articleId, action, reason } = body;

        if (!articleId || !action) {
            return NextResponse.json({ error: 'Article ID and action are required' }, { status: 400 });
        }

        const cleanId = String(articleId).trim();
        let docRef = db.collection('news_articles').doc(cleanId);
        let doc = await docRef.get();

        if (!doc.exists) {
            const querySnap = await db.collection('news_articles').where('id', '==', cleanId).get();
            if (!querySnap.empty) {
                doc = querySnap.docs[0];
                docRef = querySnap.docs[0].ref;
            } else {
                return NextResponse.json({ error: 'Article not found' }, { status: 404 });
            }
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        const docData = doc.data() || {};
        const updateData = {
            id: docRef.id,
            approvalStatus: status,
            active: status === 'approved' ? true : (docData.active ?? false),
            adminResponse: reason || '',
            updatedAt: new Date().toISOString()
        };

        if (status === 'approved') {
            updateData.publishedAt = docData.publishedAt || new Date().toISOString();
        }

        await docRef.set(updateData, { merge: true });

        purgeCache('news_');
        purgeCache('admin_news_list_');
        purgeCache('admin_pending');
        purgeCache('admin_reporters_with_stats');
        purgeCache('admin_stats');

        return NextResponse.json({ success: true, status, id: docRef.id });
    } catch (error) {
        console.error('Error approving news:', error.message);
        return NextResponse.json({ error: error.message || 'Failed to process approval' }, { status: 500 });
    }
}
