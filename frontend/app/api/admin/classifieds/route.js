import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCache, setCache, purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';


// GET: List all Classifieds (Admin)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const forceFresh = searchParams.get('fresh') === 'true';

        // opt(PERF-03): Cache admin classifieds list for 2 minutes.
        // Each tab visit was re-scanning the entire classified_ads collection.
        // Cache is purged on any write (POST/PUT/DELETE).
        const CACHE_KEY = 'admin_classifieds_list';
        if (forceFresh) {
            purgeCache(CACHE_KEY);
        } else {
            const cached = getCache(CACHE_KEY);
            if (cached) {
                return NextResponse.json(cached, {
                    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
                });
            }
        }

        // In admin, we want to see everything
        const snapshot = await db.collection('classified_ads')
            .orderBy('createdAt', 'desc')
            .get();

        const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setCache(CACHE_KEY, ads, 2 * 60 * 1000); // 2-minute TTL
        return NextResponse.json(ads, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
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
        const {
            title,
            description,
            category,
            price,
            contact,
            phone,
            whatsapp,
            city,
            location,
            images,
            image,
            sellerName,
            condition,
            status
        } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const imageList = Array.isArray(images)
            ? images.filter(Boolean)
            : (images ? [images] : []);
        const primaryImage = (typeof image === 'string' && image) || imageList[0] || '';
        if (primaryImage && !imageList.includes(primaryImage)) {
            imageList.unshift(primaryImage);
        }

        const phoneVal = (phone || contact || '').trim();
        const locVal = (location || city || '').trim();

        const newAd = {
            title: title.trim(),
            description: description || '',
            category: category || 'Other',
            price: price || '',
            contact: phoneVal,
            contactPhone: phoneVal,
            phone: phoneVal,
            whatsapp: whatsapp || '',
            city: locVal,
            location: locVal,
            sellerName: sellerName || '',
            condition: condition || 'Good',
            images: imageList,
            image: primaryImage,
            status: status || 'approved',
            approvalStatus: 'approved',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('classified_ads').add(newAd);
        await docRef.update({ id: docRef.id });
        purgeCache('admin_classifieds_list'); // Invalidate admin list cache
        purgeCache('classifieds'); // Invalidate public classifieds cache

        return NextResponse.json({ id: docRef.id, ...newAd });
    } catch (error) {
        console.error('Error creating admin classified:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
