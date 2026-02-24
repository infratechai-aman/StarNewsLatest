import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';

// Helper for Role check
async function canManageNews(token) {
    if (!token) return false;
    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;
        return role === 'reporter' || role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// GET: My Submitted News
export async function GET(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const decodedUser = await auth.verifyIdToken(token);
        // Verify role too
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;
        if (role !== 'reporter' && role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await db.collection('news_articles')
            .where('authorId', '==', decodedUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const articles = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        return NextResponse.json({ articles });
    } catch (error) {
        console.error('Error fetching reporter news:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Submit News for Review
// Note: This duplicates some logic from /api/news POST, but enforces 'pending' status
export async function POST(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        const decodedUser = await auth.verifyIdToken(token);

        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;

        if (role !== 'reporter' && role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, categoryId, category, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, authorName, thumbnailUrl, featured } = body;

        // Auto-translate Title and Content
        const translatedTitle = await translateText(title);
        const translatedContent = await translateText(content);

        // Resolve Category
        let finalCategoryId = categoryId || category;
        // Simple validation...

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
            authorId: decodedUser.uid,
            authorName: authorName || userDoc.data().name || '',
            thumbnailUrl: thumbnailUrl || '',
            featured: featured || false,
            approvalStatus: 'pending', // Force pending
            active: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('news_articles').add(newArticle);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newArticle });
    } catch (error) {
        console.error('Error submitting reporter news:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
