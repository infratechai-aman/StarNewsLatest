import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCache, setCache, purgeCache } from '@/lib/cache';

// GET: List all businesses (Admin)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const forceFresh = searchParams.get('fresh') === 'true';

        // opt(PERF-03): Cache admin businesses list for 2 minutes.
        // Each tab visit was re-scanning the entire businesses collection.
        // Cache is purged on any write (POST/PUT/DELETE).
        const CACHE_KEY = 'admin_businesses_list';
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

        const snapshot = await db.collection('businesses')
            .orderBy('createdAt', 'desc')
            .get();

        const businesses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            enabled: doc.data().active
        }));

        setCache(CACHE_KEY, businesses, 2 * 60 * 1000); // 2-minute TTL
        return NextResponse.json(businesses, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error) {
        console.error('Error fetching admin businesses:', error); // fix(P2-BE-02)
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
        await docRef.update({ id: docRef.id });
        purgeCache('admin_businesses_list'); // Invalidate admin list cache

        return NextResponse.json({ id: docRef.id, ...newBusiness });
    } catch (error) {
        console.error('Error creating business:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
