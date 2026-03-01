import { NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/firebaseAdmin';

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

export async function POST(request) {
    try {
        const db = getDb();
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        const body = await request.json();
        const { fullName, phone, email, experience, portfolio, reason } = body;
        if (!fullName || !phone || !email) {
            return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 });
        }

        // Check if an application from this email already exists
        const existingDocs = await db.collection('reporter_applications')
            .where('email', '==', email.toLowerCase().trim())
            .get();

        if (!existingDocs.empty) {
            return NextResponse.json({ error: 'An application with this email already exists' }, { status: 400 });
        }

        const newDocRef = db.collection('reporter_applications').doc();
        const applicationData = {
            id: newDocRef.id,
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.toLowerCase().trim(),
            experience: experience?.trim() || '',
            portfolio: portfolio?.trim() || '',
            reason: reason?.trim() || '',
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await newDocRef.set(applicationData);

        return NextResponse.json({ success: true, message: 'Application submitted successfully', id: newDocRef.id });
    } catch (error) {
        // console.error('Reporter application POST error:', error);
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }
}

export async function GET(request) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        const snapshot = await db.collection('reporter_applications')
            .orderBy('submittedAt', 'desc')
            .get();

        const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ applications });
    } catch (error) {
        // console.error('Reporter applications GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
}

export async function PUT(request) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        const body = await request.json();
        const { id, status, adminNote } = body;

        if (!id || !status || !['PENDING', 'CONTACTED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'ID and valid status are required' }, { status: 400 });
        }

        await db.collection('reporter_applications').doc(id).update({
            status,
            adminNote: adminNote || '',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, message: 'Application updated' });
    } catch (error) {
        // console.error('Reporter application PUT error:', error);
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.collection('reporter_applications').doc(id).delete();

        return NextResponse.json({ success: true, message: 'Application deleted' });
    } catch (error) {
        // console.error('Reporter application DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }
}
