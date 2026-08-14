import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// GET: Navigation settings
export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const doc = await db.collection('settings').doc('navigation').get();
        return NextResponse.json(doc.exists ? doc.data() : { items: [] });
    } catch (error) {
        console.error('Error fetching navigation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update Navigation
export async function PUT(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const body = await request.json();
        await db.collection('settings').doc('navigation').set(body, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating navigation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
