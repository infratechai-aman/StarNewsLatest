import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';

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

// PUT: Update News (Admin)
export async function PUT(request, { params }) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        const body = await request.json();

        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const updateData = { ...body, updatedAt: new Date().toISOString() };

        // Auto-translate if strings provided
        if (body.title && typeof body.title === 'string') {
            updateData.title = await translateText(body.title);
        }
        if (body.content && typeof body.content === 'string') {
            updateData.content = await translateText(body.content);
        }

        // Clean up data
        delete updateData.id;
        delete updateData.createdAt;

        await docRef.update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating admin news:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove News (Admin)
export async function DELETE(request, { params }) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        await db.collection('news_articles').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin news:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
