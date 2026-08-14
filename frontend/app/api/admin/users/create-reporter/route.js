import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Create Reporter (Admin only)
export async function POST(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    const auth = getAuth();

    if (!db || !auth) {
        return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { name, email, password, phone } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
        }

        // 1. Create in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Create in Firestore
        const newUser = {
            name,
            email,
            phone: phone || '',
            role: 'reporter',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.collection('users').doc(userRecord.uid).set(newUser);

        // 3. Set Custom Claim
        await auth.setCustomUserClaims(userRecord.uid, { role: 'reporter' });

        return NextResponse.json({ reporter: { id: userRecord.uid, ...newUser } });

    } catch (error) {
        console.error('Error creating reporter:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
