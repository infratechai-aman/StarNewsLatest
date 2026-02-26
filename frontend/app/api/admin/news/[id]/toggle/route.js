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

// POST: Toggle News Visibility (Admin)
export async function POST(request, { params }) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const newStatus = !doc.data().active;
        await docRef.update({ active: newStatus });

        return NextResponse.json({ success: true, enabled: newStatus });
    } catch (error) {
        console.error('Error toggling admin news:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
