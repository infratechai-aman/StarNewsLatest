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

        // fix(P2-AUTH-01): Only return safe, known fields — never expose raw Firestore doc.
        // This prevents leaking internal tokens, admin notes, or any unexpected fields.
        const d = userDoc.data();
        return NextResponse.json({
            id: d.id || user.userId,
            email: d.email || '',
            name: d.name || '',
            role: d.role || 'registered',
            status: d.status || 'active',
            phone: d.phone || '',
            address: d.address || '',
            profileImage: d.profileImage || '',
            requirePasswordChange: d.requirePasswordChange || false,
            createdAt: d.createdAt || '',
            updatedAt: d.updatedAt || ''
        })
    } catch (error) {
        console.error('Auth/Me Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
