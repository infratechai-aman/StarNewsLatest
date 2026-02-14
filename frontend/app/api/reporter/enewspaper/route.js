import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Helper for Role check
async function hasRole(token, allowedRoles) {
    if (!token) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && allowedRoles.includes(userDoc.data().role);
    } catch (e) {
        return false;
    }
}

// POST: Create E-Newspaper (Reporter/Admin)
export async function POST(request) {
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
        console.error('Error creating enewspaper:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
