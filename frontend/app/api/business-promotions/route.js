import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// POST: Submit Promotion (Public)
export async function POST(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database service not available' }, { status: 503 });
    }

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
            name: finalName,
            ownerName: (ownerName || '').trim(),
            phone: finalPhone,
            whatsapp: (whatsapp || finalPhone).trim(),
            email: (email || '').trim(),
            address: (address || '').trim(),
            description: (description || '').trim(),
            category: category || 'Services',
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('business_promotions').add(newPromo);
        await docRef.set({ id: docRef.id }, { merge: true });

        // Also add to businesses collection with approvalStatus: 'pending'
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
            await bizRef.set({ id: bizRef.id }, { merge: true });
        } catch (bizErr) {
            console.warn('Could not mirror promotion to businesses collection:', bizErr.message);
        }

        // Purge pending and businesses caches
        purgeCache('business_promotions');
        purgeCache('admin_pending');
        purgeCache('businesses');

        return NextResponse.json({ id: docRef.id, ...newPromo });
    } catch (error) {
        console.error('Error submitting promotion:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// GET: List Promotions (Admin)
export async function GET(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database service not available' }, { status: 503 });
    }

    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        let promotions = [];
        try {
            const snapshot = await db.collection('business_promotions')
                .orderBy('submittedAt', 'desc')
                .get();
            // Guarantee that doc.id takes precedence over any inner doc.data().id
            promotions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (orderErr) {
            console.warn('Fallback: fetching business_promotions without orderBy index:', orderErr.message);
            const snapshot = await db.collection('business_promotions').get();
            promotions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            promotions.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
        }

        return NextResponse.json({ promotions }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update Promotion Status (Admin: Approve / Reject / Contacted)
export async function PUT(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database service not available' }, { status: 503 });
    }

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

        const cleanId = String(id).trim();
        let targetRef = db.collection('business_promotions').doc(cleanId);
        let snap = await targetRef.get();

        // If doc not found by document key, search by inner 'id' field
        if (!snap.exists) {
            const querySnap = await db.collection('business_promotions').where('id', '==', cleanId).get();
            if (!querySnap.empty) {
                targetRef = querySnap.docs[0].ref;
                snap = querySnap.docs[0];
            }
        }

        const normalizedStatus = String(status).toUpperCase().trim();
        const updatePayload = {
            id: targetRef.id,
            status: normalizedStatus,
            adminNote: adminNote || '',
            updatedAt: new Date().toISOString()
        };

        // Use .set(..., { merge: true }) so it never throws 404 NOT_FOUND
        await targetRef.set(updatePayload, { merge: true });

        // Retrieve existing promotion data for syncing with the businesses directory
        const existingData = snap.exists ? snap.data() : {};
        const bName = existingData.businessName || existingData.name;
        const bPhone = existingData.phone;

        // If Approved: Ensure it is activated or created in the 'businesses' directory
        if (normalizedStatus === 'APPROVED' && bName && bPhone) {
            try {
                const bizQuery = await db.collection('businesses').where('phone', '==', bPhone).get();
                if (!bizQuery.empty) {
                    for (const bDoc of bizQuery.docs) {
                        await bDoc.ref.set({
                            approvalStatus: 'approved',
                            active: true,
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                    }
                } else {
                    const newBizDoc = await db.collection('businesses').add({
                        name: bName,
                        businessName: bName,
                        ownerName: existingData.ownerName || '',
                        category: existingData.category || 'Services',
                        phone: bPhone,
                        whatsapp: existingData.whatsapp || bPhone,
                        email: existingData.email || '',
                        address: existingData.address || '',
                        description: existingData.description || '',
                        approvalStatus: 'approved',
                        active: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    await newBizDoc.set({ id: newBizDoc.id }, { merge: true });
                }
            } catch (syncErr) {
                console.warn('Sync promotion to businesses failed:', syncErr.message);
            }
        } else if (normalizedStatus === 'REJECTED' && bPhone) {
            try {
                const bizQuery = await db.collection('businesses').where('phone', '==', bPhone).get();
                for (const bDoc of bizQuery.docs) {
                    await bDoc.ref.set({
                        approvalStatus: 'rejected',
                        active: false,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            } catch (syncErr) {
                console.warn('Sync promotion rejection failed:', syncErr.message);
            }
        }

        // Invalidate all related caches
        purgeCache('business_promotions');
        purgeCache('businesses');
        purgeCache('admin_pending');
        purgeCache('admin_businesses_list');
        purgeCache('admin_stats');

        return NextResponse.json({ success: true, id: targetRef.id, status: normalizedStatus });
    } catch (error) {
        console.error('[business-promotions PUT error]:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove Promotion Request (Admin)
export async function DELETE(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database service not available' }, { status: 503 });
    }

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

        const cleanId = String(id).trim();
        const docRef = db.collection('business_promotions').doc(cleanId);
        const snap = await docRef.get();

        if (snap.exists) {
            await docRef.delete();
        } else {
            const querySnap = await db.collection('business_promotions').where('id', '==', cleanId).get();
            if (!querySnap.empty) {
                await querySnap.docs[0].ref.delete();
            }
        }

        purgeCache('business_promotions');
        purgeCache('admin_pending');
        purgeCache('admin_stats');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[business-promotions DELETE error]:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
