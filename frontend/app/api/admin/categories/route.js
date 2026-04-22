import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache, invalidateCache } from '@/lib/cache';

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

// GET: List ALL categories for admin (including inactive)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await db.collection('news_categories').get();

        let categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        categories.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Admin Categories GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new category (Admin only)
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
        const { name, nameHi, nameMr, slug, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
        }

        const newSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

        const newCategory = {
            name,
            nameHi: nameHi || name,
            nameMr: nameMr || name,
            slug: newSlug,
            description: description || '',
            active: true,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('news_categories').add(newCategory);

        // Invalidate public categories cache
        invalidateCache('categories_all');

        return NextResponse.json({
            id: docRef.id,
            ...newCategory
        });
    } catch (error) {
        console.error('Admin Categories POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
