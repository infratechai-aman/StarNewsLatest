import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin, isSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: My E-Newspapers (isolated per reporter; super admins see all)
export async function GET(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    const isAdmin = isSuperAdmin(authResult.user);
    const reporterId = authResult.user.userId;

    try {
        let papers = [];

        if (isAdmin) {
            // Super admins see all e-newspapers across all reporters
            try {
                const snapshot = await db.collection('enewspapers')
                    .orderBy('createdAt', 'desc')
                    .get();
                papers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            } catch {
                const snapshot = await db.collection('enewspapers').get();
                papers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                papers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        } else {
            // Reporters only see their own uploads (strict isolation by authorId)
            try {
                const snapshot = await db.collection('enewspapers')
                    .where('authorId', '==', reporterId)
                    .orderBy('createdAt', 'desc')
                    .get();
                papers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            } catch {
                // Index fallback: filter in-memory by authorId (or authorEmail for older docs)
                const snapshot = await db.collection('enewspapers').get();
                papers = snapshot.docs
                    .map(doc => ({ ...doc.data(), id: doc.id }))
                    .filter(p => p.authorId === reporterId || p.authorEmail === authResult.user.email)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        }

        return NextResponse.json({ papers });
    } catch (error) {
        console.error('Reporter enewspaper GET error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create E-Newspaper (Reporter/Admin) — saves authorId for isolation
export async function POST(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    try {
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
            // Per-reporter isolation fields
            authorId: authResult.user.userId,
            authorEmail: authResult.user.email || '',
            authorName: authResult.user.name || authResult.user.email || '',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('enewspapers').add(newPaper);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newPaper });
    } catch (error) {
        console.error('Reporter enewspaper POST error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
