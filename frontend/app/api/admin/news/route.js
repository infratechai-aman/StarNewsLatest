import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';


// GET: List all news (Admin)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const snapshot = await db.collection('news_articles')
            .orderBy('createdAt', 'desc')
            .get();

        const news = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        return NextResponse.json(news);
    } catch (error) {
        console.error('Error fetching admin news:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create News (Admin - Auto Approved)
export async function POST(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const body = await request.json();
        const { title, content, categoryId, category, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, featured, showOnHome, authorName, thumbnailUrl, thumbnails } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        // Content size limits
        const titleStr = typeof title === 'string' ? title : JSON.stringify(title)
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
        if (titleStr.length > 500) {
            return NextResponse.json({ error: 'Title must be under 500 characters' }, { status: 400 })
        }
        if (contentStr.length > 500000) {
            return NextResponse.json({ error: 'Content too large (max 500KB)' }, { status: 400 })
        }

        // Auto-translate if strings provided
        const translatedTitle = typeof title === 'string' ? await translateText(title) : title;
        const translatedContent = typeof content === 'string' ? await translateText(content) : content;

        const newArticle = {
            title: translatedTitle,
            content: translatedContent,
            categoryId: categoryId || category || 'City News',
            category: category || categoryId || 'City News',
            city: city || '',
            mainImage: mainImage || '',
            galleryImages: galleryImages || [],
            videoUrl: videoUrl || youtubeUrl || '',
            youtubeUrl: youtubeUrl || videoUrl || '',
            tags: tags || [],
            metaDescription: metaDescription || '',
            thumbnailUrl: thumbnailUrl || mainImage || '',
            thumbnails: thumbnails || (thumbnailUrl ? [thumbnailUrl] : []),
            featured: featured || false,
            showOnHome: showOnHome !== false,
            authorName: authorName || 'Admin',
            approvalStatus: 'approved',
            active: true,
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString()
        };

        const docRef = await db.collection('news_articles').add(newArticle);
        purgeCache('news_');

        return NextResponse.json({ id: docRef.id, ...newArticle });
    } catch (error) {
        // console.error('Error creating admin news:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
