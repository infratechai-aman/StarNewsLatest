import { NextResponse } from 'next/server';
import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

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
            accountCreated: false,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await newDocRef.set(applicationData);

        return NextResponse.json({ success: true, message: 'Application submitted successfully', id: newDocRef.id });
    } catch (error) {
        console.error('Reporter application POST error:', error);
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

        let snapshot;
        try {
            snapshot = await db.collection('reporter_applications')
                .orderBy('submittedAt', 'desc')
                .get();
        } catch (err) {
            snapshot = await db.collection('reporter_applications').get();
        }

        // Cross-reference with 'users' collection to check if an account exists for each applicant
        const usersSnapshot = await db.collection('users').where('role', '==', 'reporter').get();
        const reporterEmails = new Set();
        const userMap = {};
        for (const uDoc of usersSnapshot.docs) {
            const uData = uDoc.data();
            if (uData.email) {
                const em = uData.email.toLowerCase().trim();
                reporterEmails.add(em);
                userMap[em] = { id: uDoc.id, ...uData };
            }
        }

        const applications = snapshot.docs.map(doc => {
            const data = doc.data();
            const em = (data.email || '').toLowerCase().trim();
            const isCreated = Boolean(data.accountCreated || reporterEmails.has(em));
            const linkedUser = userMap[em];

            return {
                ...data,
                id: doc.id,
                accountCreated: isCreated,
                accountId: data.accountId || linkedUser?.id || null,
                accountEmail: data.accountEmail || (isCreated ? em : null),
                tempPassword: data.tempPassword || null
            };
        });

        // Ensure sorted by submittedAt descending
        applications.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

        return NextResponse.json({ applications }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error) {
        console.error('Reporter applications GET error:', error);
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
        const { id, status, adminNote, password, createAccount, loginEmail } = body;

        const validStatuses = ['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED'];
        if (!id || !status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: `ID and valid status (${validStatuses.join(', ')}) are required` }, { status: 400 });
        }

        const cleanId = String(id).trim();
        let appRef = db.collection('reporter_applications').doc(cleanId);
        let appDoc = await appRef.get();
        if (!appDoc.exists) {
            const byField = await db.collection('reporter_applications').where('id', '==', cleanId).get();
            if (!byField.empty) {
                appRef = byField.docs[0].ref;
                appDoc = byField.docs[0];
            } else {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 });
            }
        }

        const appData = appDoc.data() || {};
        const appEmail = (loginEmail || appData.email || '').toLowerCase().trim();
        const appName = appData.fullName || 'Reporter';
        const appPhone = appData.phone || '';

        let accountCreated = Boolean(appData.accountCreated);
        let accountId = appData.accountId || null;
        let savedTempPassword = appData.tempPassword || null;

        // If approving or explicitly creating account with a password:
        if ((status === 'APPROVED' || createAccount) && password && password.length >= 6) {
            if (auth) {
                let userRecord;
                try {
                    userRecord = await auth.getUserByEmail(appEmail);
                    await auth.updateUser(userRecord.uid, {
                        password: password,
                        displayName: appName
                    });
                } catch (authErr) {
                    if (authErr.code === 'auth/user-not-found' || authErr.message?.includes('no user')) {
                        userRecord = await auth.createUser({
                            email: appEmail,
                            password: password,
                            displayName: appName
                        });
                    } else {
                        throw authErr;
                    }
                }

                accountId = userRecord.uid;
                accountCreated = true;
                savedTempPassword = password;

                // Update users collection
                const userDocRef = db.collection('users').doc(userRecord.uid);
                await userDocRef.set({
                    id: userRecord.uid,
                    email: appEmail,
                    name: appName,
                    phone: appPhone,
                    role: 'reporter',
                    status: 'active',
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                // Set custom claims
                try {
                    await auth.setCustomUserClaims(userRecord.uid, { role: 'reporter' });
                } catch (claimErr) {
                    console.warn('Could not set custom user claim:', claimErr.message);
                }
            }
        } else if (status === 'APPROVED' && appEmail) {
            // General approval without custom password: check if user already exists
            const userSnap = await db.collection('users').where('email', '==', appEmail).get();
            if (!userSnap.empty) {
                const uDoc = userSnap.docs[0];
                accountId = uDoc.id;
                accountCreated = true;
                await uDoc.ref.set({
                    role: 'reporter',
                    status: 'active',
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        }

        const updatePayload = {
            id: appRef.id,
            status,
            adminNote: adminNote || '',
            accountCreated,
            accountId,
            accountEmail: appEmail,
            updatedAt: new Date().toISOString()
        };

        if (savedTempPassword) {
            updatePayload.tempPassword = savedTempPassword;
        }

        await appRef.set(updatePayload, { merge: true });

        // Purge caches
        purgeCache('admin_pending');
        purgeCache('admin_reporters_with_stats');
        purgeCache('admin_stats');

        return NextResponse.json({
            success: true,
            message: status === 'APPROVED' ? 'Application approved and account updated' : `Application marked as ${status}`,
            status,
            accountCreated,
            accountId,
            accountEmail: appEmail,
            tempPassword: savedTempPassword
        });
    } catch (error) {
        console.error('Reporter application PUT error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update application' }, { status: 500 });
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

        const cleanId = String(id).trim();
        const docRef = db.collection('reporter_applications').doc(cleanId);
        const snap = await docRef.get();

        if (snap.exists) {
            await docRef.delete();
        } else {
            const byField = await db.collection('reporter_applications').where('id', '==', cleanId).get();
            if (!byField.empty) {
                await byField.docs[0].ref.delete();
            }
        }

        purgeCache('admin_pending');
        purgeCache('admin_reporters_with_stats');
        purgeCache('admin_stats');

        return NextResponse.json({ success: true, message: 'Application deleted' });
    } catch (error) {
        console.error('Reporter application DELETE error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete application' }, { status: 500 });
    }
}
