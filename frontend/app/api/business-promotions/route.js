import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Helper for Admin check
async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// POST: Submit Promotion (Public)
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const body = await request.json();
        const { businessName, ownerName, phone, email, address, description } = body;

        if (!businessName || !phone) {
            return NextResponse.json({ error: 'Business Name and Phone are required' }, { status: 400 });
        }

        const newPromo = {
            businessName,
            ownerName: ownerName || '',
            phone,
            email: email || '',
            address: address || '',
            description: description || '',
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection('business_promotions').add(newPromo);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ id: docRef.id, ...newPromo });
    } catch (error) {
        // console.error('Error submitting promotion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: List Promotions (Admin)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await db.collection('business_promotions')
            .orderBy('submittedAt', 'desc')
            .get();

        const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(promotions);
    } catch (error) {
        // console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// PUT: Update Promotion Status (Admin)
export async function PUT(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove Promotion Request (Admin)
export async function DELETE(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
