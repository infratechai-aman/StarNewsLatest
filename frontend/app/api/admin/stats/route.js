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

// GET: Admin Dashboard Stats
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Firestore count aggregation is efficient but requires specific index or count() query
        // For now, simpler approach: use aggregate queries if possible, or just normal size
        // Note: bucket counts are not available in client SDK easily, need admin query.

        const newsCount = await db.collection('news_articles').count().get();
        const usersCount = await db.collection('users').count().get();
        const businessCount = await db.collection('businesses').count().get();

        return NextResponse.json({
            totalNews: newsCount.data().count,
            totalUsers: usersCount.data().count,
            totalBusinesses: businessCount.data().count
        });
    } catch (error) {
        // console.error('Error fetching stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
