import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Whitelist of allowed fields for news updates
const ALLOWED_NEWS_FIELDS = [
    'title', 'content', 'categoryId', 'category', 'city',
    'mainImage', 'galleryImages', 'videoUrl', 'youtubeUrl',
    'tags', 'metaDescription', 'authorName', 'thumbnailUrl',
    'featured', 'approvalStatus', 'active', 'genre',
    'showOnHome', 'publishedAt', 'thumbnails'
];

function sanitizeBody(body, allowedFields) {
    const sanitized = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            sanitized[field] = body[field];
        }
    }
    return sanitized;
}

// PUT: Update News (Admin)
export async function PUT(request, { params }) {
    const db = getDb();

    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const id = params.id;
        const body = await request.json();

        // Whitelist fields to prevent mass assignment
        const updateData = sanitizeBody(body, ALLOWED_NEWS_FIELDS);
        updateData.updatedAt = new Date().toISOString();

        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Auto-translate if strings provided
        if (updateData.title && typeof updateData.title === 'string') {
            updateData.title = await translateText(updateData.title);
        }
        if (updateData.content && typeof updateData.content === 'string') {
            updateData.content = await translateText(updateData.content);
        }

        // Clean up protected fields that shouldn't be modified via update
        delete updateData.id;
        delete updateData.createdAt;

        await docRef.update(updateData);
        purgeCache('news_');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating admin news:', error.message);
        return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }
}

// DELETE: Remove News (Admin)
export async function DELETE(request, { params }) {
    const db = getDb();

    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const id = params.id;
        await db.collection('news_articles').doc(id).delete();
        purgeCache('news_');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin news:', error.message);
        return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
    }
}
