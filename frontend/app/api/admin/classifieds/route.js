import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// GET: List all Classifieds (Admin)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        // In admin, we want to see everything
        const snapshot = await db.collection('classified_ads')
            .orderBy('createdAt', 'desc')
            .get();

        const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(ads);
    } catch (error) {
        console.error('Error fetching admin classifieds:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create Classified (Admin)
export async function POST(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
        console.error('Error creating admin classified:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
