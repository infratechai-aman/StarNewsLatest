import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';

// GET: My Submitted News
export async function GET(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });

    try {
        let articles = [];
        try {
            // Primary Strategy: Server-side sort (Requires Index)
            const snapshot = await db.collection('news_articles')
                .where('authorId', '==', authResult.user.userId)
                .orderBy('createdAt', 'desc')
                .get();
            articles = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (indexError) {
            console.warn('Indexing fallback triggered for reporter news');
            // Fallback Strategy: In-memory sort (No index required)
            const snapshot = await db.collection('news_articles')
                .where('authorId', '==', authResult.user.userId)
                .get();
            articles = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return NextResponse.json({ articles });
    } catch (error) {
        console.error('Reporter news GET error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Submit News for Review
export async function POST(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });

    try {
        const body = await request.json();
        const { title, content, categoryId, category, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, authorName, thumbnailUrl, featured } = body;

        // Content size limits
        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }
        if (title.length > 500) {
            return NextResponse.json({ error: 'Title must be under 500 characters' }, { status: 400 });
        }
        if (content.length > 500000) {
            return NextResponse.json({ error: 'Content too large (max 500KB)' }, { status: 400 });
        }

        // Auto-translate Title and Content (parallel for speed)
        const [translatedTitle, translatedContent] = await Promise.all([
            translateText(title),
            translateText(content)
        ]);

        // Resolve Category
        let finalCategoryId = categoryId || category;

        const newArticle = {
            title: translatedTitle,
            content: translatedContent,
            categoryId: finalCategoryId,
            city: city || '',
            genre: 'breaking',
            mainImage: mainImage || '',
            galleryImages: galleryImages || [],
            videoUrl: videoUrl || '',
            youtubeUrl: youtubeUrl || '',
            tags: tags || [],
            metaDescription: metaDescription || '',
            authorId: authResult.user.userId,
            authorName: authorName || authResult.user.name || '',
            thumbnailUrl: thumbnailUrl || '',
            featured: featured || false,
            approvalStatus: 'pending',
            active: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('news_articles').add(newArticle);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newArticle });
    } catch (error) {
        console.error('Reporter news POST error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
