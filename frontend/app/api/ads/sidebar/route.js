import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseAdmin'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export async function GET() {
    try {
        const doc = await db.collection('site_settings').doc('sidebar_ad').get()

        if (doc.exists) {
            const data = doc.data()
            return NextResponse.json({
                enabled: data.enabled,
                items: data.items || []
            })
        }
        return NextResponse.json({ enabled: false, items: [] })
    } catch (error) {
        console.error('Ads Sidebar GET Error:', error)
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
        const { enabled, items } = body

        await db.collection('site_settings').doc('sidebar_ad').set({
            type: 'sidebar_ad',
            items: items || [],
            enabled: enabled !== false,
            updatedAt: new Date().toISOString()
        }, { merge: true })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Ads Sidebar POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
