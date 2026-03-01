import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function hasRole(token, db, auth, allowedRoles) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && allowedRoles.includes(userDoc.data().role);
    } catch (e) {
        return false;
    }
}

// GET: List all E-Newspapers (Admin)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        // Allow Reporter too as they might check history
        if (!(await hasRole(token, db, auth, ['super_admin', 'reporter']))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await db.collection('enewspapers')
            .orderBy('publishDate', 'desc')
            .get();

        const papers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            pdfUrl: doc.data().pdfUrl,
            thumbnailUrl: doc.data().thumbnailUrl
        }));

        return NextResponse.json({ papers });
    } catch (error) {
        console.error('Error fetching admin enewspapers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// POST: Upload E-Newspaper (Admin)
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await hasRole(token, db, auth, ['super_admin']))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { title, pdfUrl, thumbnailUrl, publishDate, active } = body;

        if (!title || !pdfUrl) {
            return NextResponse.json({ error: 'Title and PDF URL are required' }, { status: 400 });
        }

        const newPaper = {
            title,
            pdfUrl,
            thumbnailUrl: thumbnailUrl || '',
            publishDate: publishDate || new Date().toISOString().split('T')[0],
            active: active !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('enewspapers').add(newPaper);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newPaper });
    } catch (error) {
        console.error('Error uploading enewspaper:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
