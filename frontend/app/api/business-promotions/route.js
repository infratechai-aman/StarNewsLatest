import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

// Helper for Admin check

// POST: Submit Promotion (Public)
export async function POST(request) {
    const db = getDb();
    try {
        const body = await request.json();
        const { businessName, name, ownerName, phone, email, address, description, category, whatsapp } = body;

        const finalName = (businessName || name || '').trim();
        const finalPhone = (phone || '').trim();

        if (!finalName || !finalPhone) {
            return NextResponse.json({ error: 'Business Name and Phone are required' }, { status: 400 });
        }

        const newPromo = {
            businessName: finalName,
            ownerName: (ownerName || '').trim(),
            phone: finalPhone,
            email: (email || '').trim(),
            address: (address || '').trim(),
            description: (description || '').trim(),
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('business_promotions').add(newPromo);
        await docRef.update({ id: docRef.id });

        // Also add to businesses collection with approvalStatus: 'pending' so it appears in Admin's pending businesses queue
        try {
            const newBiz = {
                name: finalName,
                businessName: finalName,
                ownerName: (ownerName || '').trim(),
                category: category || 'Services',
                phone: finalPhone,
                whatsapp: (whatsapp || finalPhone).trim(),
                email: (email || '').trim(),
                address: (address || '').trim(),
                description: (description || '').trim(),
                approvalStatus: 'pending',
                active: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const bizRef = await db.collection('businesses').add(newBiz);
            await bizRef.update({ id: bizRef.id });
        } catch (bizErr) {
            console.warn('Could not mirror promotion to businesses collection:', bizErr.message);
        }

        // Purge pending and businesses caches
        purgeCache('admin_pending');
        purgeCache('businesses');

        return NextResponse.json({ id: docRef.id, ...newPromo });
    } catch (error) {
        // console.error('Error submitting promotion:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET: List Promotions (Admin)
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const snapshot = await db.collection('business_promotions')
            .orderBy('submittedAt', 'desc')
            .get();

        const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ promotions }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error) {
        // console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// PUT: Update Promotion Status (Admin)
export async function PUT(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const body = await request.json();
        const { id, status, adminNote } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
        }

        await db.collection('business_promotions').doc(id).update({
            status,
            adminNote: adminNote || '',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // console.error('Error updating promotion:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove Promotion Request (Admin)
export async function DELETE(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.collection('business_promotions').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        // console.error('Error deleting promotion:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
