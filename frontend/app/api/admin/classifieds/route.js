import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

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

// GET: List all Classifieds (Admin)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // In admin, we want to see everything
        const snapshot = await db.collection('classified_ads')
            .orderBy('createdAt', 'desc')
            .get();

        const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(ads);
    } catch (error) {
        console.error('Error fetching admin classifieds:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// POST: Create Classified (Admin)
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
        const { title, description, category, price, contact, city, images, status } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const newAd = {
            title,
            description: description || '',
            category: category || '',
            price: price || '',
            contact: contact || '',
            city: city || '',
            images: images || [],
            status: status || 'approved',
            approvalStatus: 'approved',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('classified_ads').add(newAd);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newAd });
    } catch (error) {
        console.error('Error creating admin classified:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
