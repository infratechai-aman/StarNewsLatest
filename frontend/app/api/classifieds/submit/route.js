import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { submitLimiter } from '@/lib/rateLimit';
import { purgeCache } from '@/lib/cache';

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
        const { title, description, category, price, contactName, contactPhone, phone, contactEmail, location, images, image, condition, whatsapp, sellerName } = body;

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
        if (images && Array.isArray(images) && images.length > 8) {
            return NextResponse.json({ error: 'Maximum 8 images allowed' }, { status: 400 });
        }

        const phoneVal = (phone || contactPhone || '').trim();
        if (phoneVal.length > 25) {
            return NextResponse.json({ error: 'Phone number too long' }, { status: 400 });
        }
        if (contactEmail && contactEmail.length > 100) {
            return NextResponse.json({ error: 'Email too long' }, { status: 400 });
        }

        const imageList = Array.isArray(images)
            ? images.filter(Boolean).slice(0, 8)
            : (images ? [images] : (image ? [image] : []));
        const firstImage = (typeof image === 'string' && image) || imageList[0] || '';
        if (firstImage && !imageList.includes(firstImage)) {
            imageList.unshift(firstImage);
        }

        const newAd = {
            title: title.trim(),
            description: (description || '').slice(0, 5000),
            category: (category || 'Other').slice(0, 100),
            price: price || 'Price on Request',
            contactName: (contactName || sellerName || '').slice(0, 100),
            sellerName: (sellerName || contactName || '').slice(0, 100),
            contactPhone: phoneVal,
            phone: phoneVal,
            whatsapp: whatsapp || '',
            contactEmail: (contactEmail || '').slice(0, 100),
            location: (location || '').slice(0, 200),
            condition: condition || 'Good',
            images: imageList,
            image: firstImage,
            approvalStatus: 'pending',
            active: false,
            userId: null, // Public submission
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('classified_ads').add(newAd);
        await docRef.update({ id: docRef.id });

        // Purge pending and public classified caches so Admin and public views stay updated
        purgeCache('admin_pending');
        purgeCache('classifieds');

        return NextResponse.json({ id: docRef.id, ...newAd });
    } catch (error) {
        console.error('Error submitting classified:', error);
        return NextResponse.json({ error: 'Failed to submit classified. Please try again.' }, { status: 500 });
    }
}
