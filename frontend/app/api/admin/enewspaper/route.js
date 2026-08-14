import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin, requireReporterOrAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: List all E-Newspapers (Admin or Reporter)
export async function GET(request) {
    // Allow Reporter too as they might check history
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
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
        console.error('Error fetching admin enewspapers:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Upload E-Newspaper (Admin only)
export async function POST(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
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
        console.error('Error uploading enewspaper:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
