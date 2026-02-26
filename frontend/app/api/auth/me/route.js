import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic'

export async function GET(request) {
    const db = getDb();
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!db) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
        }

        // Fetch latest data from Firestore
        const userDoc = await db.collection('users').doc(user.userId).get()

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        return NextResponse.json(userDoc.data())
    } catch (error) {
        console.error('Auth/Me Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
