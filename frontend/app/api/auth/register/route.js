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

        // Enforce consistent password policy (min 8 chars)
        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
        }

        // Enforce name length limit
        if (name.length > 100) {
            return NextResponse.json({ error: 'Name must be under 100 characters' }, { status: 400 })
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
        console.error('Registration error:', error.code, error.message)
        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 })
        }
        if (error.code === 'auth/invalid-email') {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
        }
        if (error.code === 'auth/weak-password') {
            // fix: message now matches the 8-char minimum enforced above
            return NextResponse.json({ error: 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }
}
