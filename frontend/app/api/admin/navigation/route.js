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

// GET: Navigation settings
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const doc = await db.collection('settings').doc('navigation').get();
        return NextResponse.json(doc.exists ? doc.data() : { items: [] });
    } catch (error) {
        console.error('Error fetching navigation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update Navigation
export async function PUT(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        await db.collection('settings').doc('navigation').set(body, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating navigation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
