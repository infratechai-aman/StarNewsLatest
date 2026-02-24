import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin'
import { getCurrentUser, hasRole, ROLES, isSuperAdmin } from '@/lib/auth'
import { translateText } from '@/lib/translation'

export async function GET(request, { params }) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const { id } = params
        const doc = await db.collection('news_articles').doc(id).get()

        if (!doc.exists) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        const data = doc.data()
        const user = await getCurrentUser(request)

        // Check visibility
        if ((data.approvalStatus !== 'approved' || !data.active) &&
            (!user || (user.userId !== data.authorId && !hasRole(user, [ROLES.SUPER_ADMIN])))) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        // Increment views (optional, might want to debounce this or use a separate counter to avoid write hotspots)
        // await db.collection('news_articles').doc(id).update({ views: admin.firestore.FieldValue.increment(1) })

        return NextResponse.json({
            id: doc.id,
            ...data
        })

    } catch (error) {
        console.error('News [ID] GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const user = await getCurrentUser(request)
        if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = params
        const body = await request.json()

        const docRef = db.collection('news_articles').doc(id)
        const doc = await docRef.get()

        if (!doc.exists) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        const currentData = doc.data()

        // Ensure ownership or admin
        if (currentData.authorId !== user.userId && !isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Prepare update data
        const updateData = { ...body, updatedAt: new Date().toISOString() }

        // Auto-translate if title or content is provided as a string
        if (body.title && typeof body.title === 'string') {
            updateData.title = await translateText(body.title);
        }
        if (body.content && typeof body.content === 'string') {
            updateData.content = await translateText(body.content);
        }

        // Status handling: if reporter updates, reset to pending?
        if (!isSuperAdmin(user) && currentData.approvalStatus === 'approved') {
            updateData.approvalStatus = 'pending'
        }

        // If super admin is explicitly setting status
        if (isSuperAdmin(user) && body.approvalStatus) {
            updateData.approvalStatus = body.approvalStatus
            if (body.approvalStatus === 'approved' && !currentData.publishedAt) {
                updateData.publishedAt = new Date().toISOString()
            }
        }

        delete updateData.id // Don't update ID
        delete updateData.createdAt // Don't update createdAt

        await docRef.update(updateData)

        return NextResponse.json({
            id,
            ...currentData,
            ...updateData
        })

    } catch (error) {
        console.error('News [ID] PUT Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const user = await getCurrentUser(request)
        // Only Admin can delete? Or author too? Original said "Emergency: Auth disabled" for admin delete
        if (!hasRole(user, [ROLES.SUPER_ADMIN])) {
            // Allow author to delete their own?
            // For now, strict Admin only usually
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = params
        await db.collection('news_articles').doc(id).delete()

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('News [ID] DELETE Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
