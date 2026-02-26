import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Create Reporter (Admin)
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();

    if (!db || !auth) {
        return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });
        }

        let decodedAdmin;
        try {
            decodedAdmin = await auth.verifyIdToken(token);
        } catch (tokenError) {
            console.error('Token verification failed:', tokenError.code, tokenError.message);
            return NextResponse.json({
                error: 'Invalid authentication token. Please log out, log back in, and try again.',
                code: tokenError.code || 'auth/invalid-token'
            }, { status: 401 });
        }

        const adminDoc = await db.collection('users').doc(decodedAdmin.uid).get();

        if (!adminDoc.exists || adminDoc.data().role !== 'super_admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

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

        // 3. Set Custom Claim (Optional but good for security)
        await auth.setCustomUserClaims(userRecord.uid, { role: 'reporter' });

        return NextResponse.json({ reporter: { id: userRecord.uid, ...newUser } });

    } catch (error) {
        console.error('Error creating reporter:', error);
        return NextResponse.json({ error: error.message, code: error.code || 'UNKNOWN' }, { status: 500 });
    }
}
