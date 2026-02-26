import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// POST: Submit Classified Ad (Public)
export async function POST(request) {
    const db = getDb();
    try {
        const body = await request.json();
        const { title, description, category, price, contactName, contactPhone, contactEmail, location, images } = body;

        const newAd = {
            title,
            description: description || '',
            category: category || '',
            price: parseFloat(price || 0),
            contactName: contactName || '',
            contactPhone: contactPhone || '',
            contactEmail: contactEmail || '',
            location: location || '',
            images: images || [],
            approvalStatus: 'pending',
            active: true, // Initially active but pending approval? Or false? Logic says 'pending' status hides it.
            userId: null, // Public submission
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('classified_ads').add(newAd);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newAd });
    } catch (error) {
        console.error('Error submitting classified:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
