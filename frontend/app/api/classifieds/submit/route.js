import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { submitLimiter } from '@/lib/rateLimit';

// POST: Submit Classified Ad (Public — rate-limited)
export async function POST(request) {
    const db = getDb();

    // Rate limiting: max 5 submissions per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success } = submitLimiter.check(ip);
    if (!success) {
        return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    if (!db) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { title, description, category, price, contactName, contactPhone, contactEmail, location, images } = body;

        // Input validation
        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        if (title.length > 200) {
            return NextResponse.json({ error: 'Title must be under 200 characters' }, { status: 400 });
        }
        if (description && description.length > 5000) {
            return NextResponse.json({ error: 'Description must be under 5000 characters' }, { status: 400 });
        }
        if (images && images.length > 8) {
            return NextResponse.json({ error: 'Maximum 8 images allowed' }, { status: 400 });
        }
        // Validate contact info
        if (contactPhone && contactPhone.length > 20) {
            return NextResponse.json({ error: 'Phone number too long' }, { status: 400 });
        }
        if (contactEmail && contactEmail.length > 100) {
            return NextResponse.json({ error: 'Email too long' }, { status: 400 });
        }

        const newAd = {
            title: title.trim(),
            description: (description || '').slice(0, 5000),
            category: (category || '').slice(0, 100),
            price: parseFloat(price || 0),
            contactName: (contactName || '').slice(0, 100),
            contactPhone: (contactPhone || '').slice(0, 20),
            contactEmail: (contactEmail || '').slice(0, 100),
            location: (location || '').slice(0, 200),
            images: (images || []).slice(0, 8),
            approvalStatus: 'pending',
            active: true,
            userId: null, // Public submission
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('classified_ads').add(newAd);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newAd });
    } catch (error) {
        console.error('Error submitting classified:', error);
        return NextResponse.json({ error: 'Failed to submit classified. Please try again.' }, { status: 500 });
    }
}
