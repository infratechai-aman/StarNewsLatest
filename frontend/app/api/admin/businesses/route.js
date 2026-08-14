import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Helper to check role

// GET: List all businesses (Admin)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const snapshot = await db.collection('businesses')
            .orderBy('createdAt', 'desc')
            .get();

        const businesses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            enabled: doc.data().active
        }));

        return NextResponse.json(businesses);
    } catch (error) {
        // console.error('Error fetching admin businesses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create Business (Admin)
export async function POST(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const body = await request.json();
        const { name, description, category, address, city, phone, email, website, image, coverImage, images, ownerId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const newBusiness = {
            name,
            description: description || '',
            category: category || '',
            address: address || '',
            city: city || '',
            phone: phone || '',
            email: email || '',
            website: website || '',
            image: image || '',
            coverImage: coverImage || '',
            images: images || [],
            ownerId: ownerId || null,
            approvalStatus: 'approved',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('businesses').add(newBusiness);
        // Update with ID
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newBusiness });
    } catch (error) {
        // console.error('Error creating business:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
