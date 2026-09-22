import { NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { purgeCache } from '@/lib/cache';

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
        console.error('Reporter application POST error:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }
}

export async function GET(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        const snapshot = await db.collection('reporter_applications')
            .orderBy('submittedAt', 'desc')
            .get();

        const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ applications }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error) {
        console.error('Reporter applications GET error:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
}

export async function PUT(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        const body = await request.json();
        const { id, status, adminNote } = body;

        const validStatuses = ['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED'];
        if (!id || !status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: `ID and valid status (${validStatuses.join(', ')}) are required` }, { status: 400 });
        }

        const appRef = db.collection('reporter_applications').doc(id);
        const appDoc = await appRef.get();
        if (!appDoc.exists) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }
        const appData = appDoc.data();
        const appEmail = (appData.email || '').toLowerCase().trim();

        // If approving, update or create user record with role: 'reporter' and status: 'active'
        if (status === 'APPROVED' && appEmail) {
            // Check if user exists in Firestore users collection
            const userSnap = await db.collection('users')
                .where('email', '==', appEmail)
                .get();

            let targetUserId = null;

            if (!userSnap.empty) {
                // User already has a document in 'users'
                const userDoc = userSnap.docs[0];
                targetUserId = userDoc.id;
                await userDoc.ref.update({
                    role: 'reporter',
                    status: 'active',
                    name: appData.fullName || userDoc.data().name || '',
                    phone: appData.phone || userDoc.data().phone || '',
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Check if user exists in Firebase Auth by email
                if (auth) {
                    try {
                        const existingAuthUser = await auth.getUserByEmail(appEmail);
                        if (existingAuthUser) {
                            targetUserId = existingAuthUser.uid;
                        }
                    } catch (e) {
                        // User not in Firebase Auth yet
                    }
                }

                // If not in Firebase Auth, create doc in 'users' with new ID
                const userDocRef = targetUserId
                    ? db.collection('users').doc(targetUserId)
                    : db.collection('users').doc();

                targetUserId = userDocRef.id;

                await userDocRef.set({
                    id: targetUserId,
                    email: appEmail,
                    name: appData.fullName || '',
                    phone: appData.phone || '',
                    role: 'reporter',
                    status: 'active',
                    createdAt: appData.submittedAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }

            // Set Firebase Auth custom claims role = 'reporter'
            if (auth && targetUserId) {
                try {
                    await auth.setCustomUserClaims(targetUserId, { role: 'reporter' });
                } catch (err) {
                    console.warn('Could not set custom user claims on approved reporter:', err.message);
                }
            }

            // Purge caches so reporter lists and pending queues update immediately
            purgeCache('admin_pending');
            purgeCache('admin_reporters_with_stats');
            purgeCache('admin_stats');
        }

        await appRef.update({
            status,
            adminNote: adminNote || '',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: status === 'APPROVED' ? 'Reporter application approved and user upgraded to reporter' : `Application marked as ${status}`,
            status
        });
    } catch (error) {
        console.error('Reporter application PUT error:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
        console.error('Reporter application DELETE error:', error); // fix(P2-BE-02)
        return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }
}
