import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';

export const dynamic = 'force-dynamic';

async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// GET: List all news (Admin)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create News (Admin - Auto Approved)
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, categoryId, category, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, featured, showOnHome, authorName, thumbnailUrl, thumbnails } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
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

        return NextResponse.json({ id: docRef.id, ...newArticle });
    } catch (error) {
        // console.error('Error creating admin news:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
