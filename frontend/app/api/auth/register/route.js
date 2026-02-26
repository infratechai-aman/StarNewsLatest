import { NextResponse } from 'next/server'
import { getAuth, getDb } from '@/lib/firebaseAdmin'
import { ROLES } from '@/lib/auth'

export async function POST(request) {
    const auth = getAuth();
    const db = getDb();

    if (!auth || !db) {
        return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    try {
        const body = await request.json()
        const { email, password, name, role = ROLES.REGISTERED } = body

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password and name required' }, { status: 400 })
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        })

        // Create user document in Firestore
        const userRole = (role === ROLES.ADVERTISER || role === ROLES.REPORTER) ? role : ROLES.REGISTERED
        const userStatus = (role === ROLES.ADVERTISER || role === ROLES.REPORTER) ? 'pending' : 'active'

        const userData = {
            id: userRecord.uid,
            email: userRecord.email,
            name: name,
            role: userRole,
            status: userStatus,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await db.collection('users').doc(userRecord.uid).set(userData)

        return NextResponse.json({
            user: userData,
            message: 'User created successfully'
        })

    } catch (error) {
        console.error('Registration error:', error)
        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
