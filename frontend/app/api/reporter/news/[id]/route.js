import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    const { id } = params;
    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const decodedUser = await auth.verifyIdToken(token);

        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Ensure owner or admin
        if (doc.data().authorId !== decodedUser.uid) {
            // Check admin role
            const userDoc = await db.collection('users').doc(decodedUser.uid).get();
            if (userDoc.data().role !== 'super_admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        await docRef.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = params;
    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const decodedUser = await auth.verifyIdToken(token);

        const docRef = db.collection('news_articles').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Ensure owner or admin
        if (doc.data().authorId !== decodedUser.uid) {
            const userDoc = await db.collection('users').doc(decodedUser.uid).get();
            if (userDoc.data().role !== 'super_admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        const body = await request.json();
        // Force pending on resave if it was rejected
        const updateData = {
            ...body,
            approvalStatus: 'pending',
            updatedAt: new Date().toISOString()
        };

        await docRef.update(updateData);
        return NextResponse.json({ success: true, ...updateData });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
