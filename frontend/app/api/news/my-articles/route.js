import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin';
import { getCurrentUser, ROLES } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    const db = getDb();
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Allow Reporters and Admins
        if (user.role !== ROLES.REPORTER && user.role !== ROLES.SUPER_ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (!db) {
            return NextResponse.json({ articles: [] })
        }

        // Query Firestore for articles by this author
        const snapshot = await db.collection('news_articles')
            .where('authorId', '==', user.userId)
            .get()

        const articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Sort in memory by createdAt desc (newest first)
        articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return NextResponse.json({ articles })

    } catch (error) {
        console.error('My Articles Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
