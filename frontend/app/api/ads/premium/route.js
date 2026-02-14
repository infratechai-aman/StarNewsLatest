import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseAdmin'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export async function GET() {
    try {
        const doc = await db.collection('site_settings').doc('premium_ad').get()

        if (doc.exists) {
            const data = doc.data()
            return NextResponse.json({
                enabled: data.enabled,
                imageUrl: data.imageUrl || '',
                linkUrl: data.linkUrl || '',
                title: data.title || ''
            })
        }
        return NextResponse.json({ enabled: false, imageUrl: '', linkUrl: '', title: '' })
    } catch (error) {
        console.error('Ads Premium GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser(request)
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { enabled, imageUrl, linkUrl, title } = body

        await db.collection('site_settings').doc('premium_ad').set({
            type: 'premium_ad',
            imageUrl,
            linkUrl,
            title,
            enabled: enabled !== false,
            updatedAt: new Date().toISOString()
        }, { merge: true })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Ads Premium POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
