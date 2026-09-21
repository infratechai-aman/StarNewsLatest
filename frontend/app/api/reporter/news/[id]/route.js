import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin, isSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Whitelist of allowed fields for reporter news updates
const ALLOWED_UPDATE_FIELDS = [
    'title', 'content', 'categoryId', 'category', 'city',
    'mainImage', 'galleryImages', 'videoUrl', 'youtubeUrl',
    'tags', 'metaDescription', 'authorName', 'thumbnailUrl', 'featured'
];

export async function DELETE(request, { params }) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    const db = getDb();
    if (!db) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    try {
        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const docData = doc.data();
        const isAdmin = isSuperAdmin(authResult.user);
        const isOwner = docData.authorId === authResult.user.userId || (docData.authorEmail && docData.authorEmail === authResult.user.email);

        // Ensure owner or admin
        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden: You can only delete your own articles' }, { status: 403 });
        }

        await docRef.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reporter news DELETE error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    const db = getDb();
    if (!db) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    try {
        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const docData = doc.data();
        const isAdmin = isSuperAdmin(authResult.user);
        const isOwner = docData.authorId === authResult.user.userId || (docData.authorEmail && docData.authorEmail === authResult.user.email);

        // Ensure owner or admin
        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden: You can only edit your own articles' }, { status: 403 });
        }

        const body = await request.json();

        // Whitelist fields to prevent mass assignment
        const updateData = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Force pending on resave
        updateData.approvalStatus = 'pending';
        updateData.updatedAt = new Date().toISOString();

        await docRef.update(updateData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reporter news PUT error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
