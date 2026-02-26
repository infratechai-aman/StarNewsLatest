import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// GET: Unified Pending List
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const pendingNews = await db.collection('news_articles')
            .where('approvalStatus', '==', 'pending').get();

        const pendingBusinesses = await db.collection('businesses')
            .where('approvalStatus', '==', 'pending').get();

        const pendingClassifieds = await db.collection('classified_ads')
            .where('approvalStatus', '==', 'pending').get();

        // Users usually don't have approval status in this model, but old logic checked 'status'='pending'
        // Let's assume users with role=advertiser/reporter might be pending
        const pendingUsers = await db.collection('users')
            .where('status', '==', 'pending').get();

        const mapDocs = (snap) => snap.docs.map(d => ({ ...d.data(), id: d.id }));

        return NextResponse.json({
            news: mapDocs(pendingNews),
            businesses: mapDocs(pendingBusinesses),
            classifieds: mapDocs(pendingClassifieds),
            ads: [], // Sidebar/Premium ads don't have pending status usually
            users: mapDocs(pendingUsers)
        });
    } catch (error) {
        console.error('Error fetching pending items:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
