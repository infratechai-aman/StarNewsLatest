import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin';
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export async function GET() {
    const db = getDb();
    try {
        const snapshot = await db.collection('news_categories')
            .where('active', '==', true)
            .get()

        let categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Sort in memory to avoid needing a Firestore Composite Index
        categories.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Categories GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    const db = getDb();
    try {
        const user = await getCurrentUser(request)
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { name, nameHi, nameMr, slug, description } = body

        const newSlug = slug || name.toLowerCase().replace(/\s+/g, '-')

        const newCategory = {
            name,
            nameHi: nameHi || name,
            nameMr: nameMr || name,
            slug: newSlug,
            description: description || '',
            active: true,
            createdAt: new Date().toISOString()
        }

        const docRef = await db.collection('news_categories').add(newCategory)

        return NextResponse.json({
            id: docRef.id,
            ...newCategory
        })

    } catch (error) {
        console.error('Categories POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
