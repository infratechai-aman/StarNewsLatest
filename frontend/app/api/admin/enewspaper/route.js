import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function hasRole(token, allowedRoles) {
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
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        // Allow Reporter too as they might check history
        if (!(await hasRole(token, ['super_admin', 'reporter']))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await db.collection('enewspapers')
            .orderBy('publishDate', 'desc')
            .get();

        const papers = snapshot.docs.map(doc => ({
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
