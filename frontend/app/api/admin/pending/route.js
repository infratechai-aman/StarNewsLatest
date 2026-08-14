import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Unified Pending List
export async function GET(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
        // Run all pending queries in parallel
        const [pendingNews, pendingBusinesses, pendingClassifieds, pendingUsers] = await Promise.all([
            db.collection('news_articles').where('approvalStatus', '==', 'pending').get(),
            db.collection('businesses').where('approvalStatus', '==', 'pending').get(),
            db.collection('classified_ads').where('approvalStatus', '==', 'pending').get(),
            db.collection('users').where('status', '==', 'pending').get()
        ]);

        const mapDocs = (snap) => snap.docs.map(d => ({ ...d.data(), id: d.id }));

        return NextResponse.json({
            news: mapDocs(pendingNews),
            businesses: mapDocs(pendingBusinesses),
            classifieds: mapDocs(pendingClassifieds),
            ads: [],
            users: mapDocs(pendingUsers)
        });
    } catch (error) {
        console.error('Error fetching pending items:', error.message);
        return NextResponse.json({ error: 'Failed to fetch pending items' }, { status: 500 });
    }
}
