import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

// GET: Fetch full live TV config (admin - includes inactive streams)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const doc = await db.collection('settings').doc('live_tv_config').get();

        if (!doc.exists) {
            return NextResponse.json({
                enabled: false,
                streams: [],
                primaryStreamId: null
            });
        }

        return NextResponse.json(doc.data());
    } catch (error) {
        console.error('Error fetching live TV config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update live TV config
export async function PUT(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();

        // Validate the config structure
        const config = {
            enabled: body.enabled !== false,
            streams: (body.streams || []).map(stream => ({
                id: stream.id || crypto.randomUUID(),
                title: stream.title || 'Untitled Stream',
                url: stream.url || '',
                isLive: stream.isLive || false,
                isActive: stream.isActive !== false,
                order: stream.order || 0,
                addedAt: stream.addedAt || new Date().toISOString()
            })),
            primaryStreamId: body.primaryStreamId || null,
            updatedAt: new Date().toISOString()
        };

        await db.collection('settings').doc('live_tv_config').set(config, { merge: false });

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error('Error updating live TV config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
