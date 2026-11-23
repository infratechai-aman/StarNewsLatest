import { withDeadline } from '@/lib/deadline'
import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { submitLimiter } from '@/lib/rateLimit';
import { getCache, setCache, purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: List active businesses (Public) with pagination
export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            console.error('Firestore DB not initialized in Business API');
            return NextResponse.json([]);
        }
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const page = Math.max(1, (parseInt(searchParams.get('page') || '1', 10) || 1));
        const limit = Math.min(100, Math.max(1, (parseInt(searchParams.get('limit') || '50', 10) || 50)));

        // Build cache key
        const cacheKey = `businesses_c${category || 'all'}_p${page}_l${limit}`;
        const cached = getCache(cacheKey);
        if (cached) return NextResponse.json(cached);

        let query = db.collection('businesses')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true);

        if (category && category !== 'All Categories') {
            query = query.where('category', '==', category);
        }

        const snapshot = await withDeadline(query.limit(limit).get());
        let businesses = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            enabled: doc.data().active // Map for frontend compatibility
        }));

        // Sort in memory to avoid index requirements
        businesses.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || 0;
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || 0;
            return dateB - dateA;
        });

        // Cache for 1 minute
        setCache(cacheKey, businesses, 60 * 1000);

        // fix(DEFECT-08): Add Cache-Control for browser/CDN caching
        const response = NextResponse.json(businesses);
        response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
        return response;
    } catch (error) {
        console.error('Error fetching businesses:', error.message);
        return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
    }
}

// POST: Submit / Create Business (Public submission goes to pending queue)
export async function POST(request) {
    // Throttle anonymous submissions per IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!submitLimiter.check(`businesses:${clientIp}`).success) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const {
            name,
            businessName,
            ownerName,
            category,
            phone,
            whatsapp,
            address,
            description,
            coverImage,
            images,
            logo,
            website,
            area,
            googleMapsLink
        } = body;

        const finalName = (name || businessName || '').trim();
        const finalPhone = (phone || '').trim();

        // Field length caps: public endpoint, so stop oversized payloads before they reach Firestore
        const LIMITS = { name: [finalName, 150], ownerName: [ownerName, 100], phone: [phone, 20], whatsapp: [whatsapp, 20],
            address: [address, 500], description: [description, 5000], website: [website, 300], area: [area, 100], googleMapsLink: [googleMapsLink, 500] };
        for (const [field, [value, max]] of Object.entries(LIMITS)) {
            if (value != null && String(value).length > max) {
                return NextResponse.json({ error: `${field} is too long (max ${max} characters)` }, { status: 400 });
            }
        }

        if (!finalName) {
            return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
        }
        if (!finalPhone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Gallery: cover first, then extra images. Only accept http(s) or same-origin paths (e.g. /api/file/<id>), max 7 total.
        const galleryImages = [coverImage, ...(Array.isArray(images) ? images : [])]
            .filter(u => typeof u === 'string' && /^(https?:\/\/|\/(?!\/))/i.test(u.trim()))
            .map(u => u.trim())
            .filter((u, i, arr) => arr.indexOf(u) === i)
            .slice(0, 7);

        const newBusiness = {
            name: finalName,
            businessName: finalName,
            ownerName: (ownerName || '').trim(),
            category: category || 'Services',
            phone: finalPhone,
            whatsapp: (whatsapp || finalPhone || '').trim(),
            address: (address || '').trim(),
            description: (description || '').trim(),
            coverImage: coverImage || '',
            images: galleryImages,
            logo: logo || coverImage || '',
            website: (website || '').trim(),
            area: (area || '').trim(),
            googleMapsLink: (googleMapsLink || '').trim(),
            approvalStatus: 'pending',
            active: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('businesses').add(newBusiness);
        await docRef.update({ id: docRef.id });

        // Also duplicate to business_promotions collection for compatibility with leads view
        try {
            await db.collection('business_promotions').add({
                id: docRef.id,
                businessId: docRef.id,
                businessName: finalName,
                ownerName: (ownerName || '').trim(),
                phone: finalPhone,
                whatsapp: (whatsapp || finalPhone || '').trim(),
                address: (address || '').trim(),
                description: (description || '').trim(),
                status: 'PENDING',
                submittedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (e) {
            console.warn('Could not mirror to business_promotions:', e.message);
        }

        // Purge pending queue and public businesses caches
        purgeCache('admin_pending');
        purgeCache('businesses');

        return NextResponse.json({ success: true, id: docRef.id, ...newBusiness });
    } catch (error) {
        console.error('Error submitting business:', error);
        return NextResponse.json({ error: 'Failed to submit business listing' }, { status: 500 });
    }
}
