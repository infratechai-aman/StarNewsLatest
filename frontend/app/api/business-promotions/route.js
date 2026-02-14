import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Helper for Admin check
async function isSuperAdmin(token) {
    if (!token) return false;
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
        console.error('Error submitting promotion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: List Promotions (Admin)
export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await db.collection('business_promotions')
            .orderBy('submittedAt', 'desc')
            .get();

        const promotions = snapshot.docs.map(doc => doc.data());
        return NextResponse.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
