import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Helper for Role check
async function hasRole(token, allowedRoles) {
    if (!token) return false;
    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && allowedRoles.includes(userDoc.data().role);
    } catch (e) {
        return false;
    }
}

// GET: My E-Newspapers
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) {
        return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
    }
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const decodedUser = await auth.verifyIdToken(token);

        // Basic check - either reporter or admin
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;
        if (role !== 'reporter' && role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        let papers = [];
        try {
            // Primary Strategy: Server-side sort (Requires Index)
            const snapshot = await db.collection('enewspapers')
                .orderBy('createdAt', 'desc')
                .get();
            papers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (indexError) {
            console.warn('Indexing fallback triggered for reporter enewspapers');
            // Fallback Strategy: In-memory sort (No index required)
            const snapshot = await db.collection('enewspapers').get();
            papers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            papers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return NextResponse.json({ papers });
    } catch (error) {
        console.error('Reporter enewspaper GET error:', error);
        return NextResponse.json({
            error: error.message,
            code: error.code || 'UNKNOWN'
        }, { status: 500 });
    }
}

// POST: Create E-Newspaper (Reporter/Admin)
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) {
        return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
    }
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await hasRole(token, ['reporter', 'super_admin']))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { title, editionDate, pdfUrl, thumbnailUrl, description } = body;

        if (!title || !editionDate || !pdfUrl) {
            return NextResponse.json({ error: 'Title, Date and PDF are required' }, { status: 400 });
        }

        const newPaper = {
            title,
            publishDate: new Date(editionDate).toISOString(),
            pdfUrl,
            thumbnailUrl: thumbnailUrl || '',
            description: description || '',
            active: true,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('enewspapers').add(newPaper);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newPaper });
    } catch (error) {
        console.error('Reporter enewspaper POST error:', error);
        return NextResponse.json({
            error: error.message,
            code: error.code || 'UNKNOWN'
        }, { status: 500 });
    }
}
