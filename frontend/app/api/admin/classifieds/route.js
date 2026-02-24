import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function isSuperAdmin(token) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// GET: List all Classifieds (Admin)
export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // In admin, we want to see everything
        const snapshot = await db.collection('classified_ads')
            .orderBy('createdAt', 'desc')
            .get();

        const ads = snapshot.docs.map(doc => doc.data());

        return NextResponse.json(ads);
    } catch (error) {
        console.error('Error fetching admin classifieds:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
