import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Create or Update Reporter Account (Admin only)
export async function POST(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    const auth = getAuth();

    if (!db || !auth) {
        return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { name, email, password, phone, applicationId } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const cleanEmail = String(email).toLowerCase().trim();
        const cleanName = String(name).trim();
        const cleanPhone = phone ? String(phone).trim() : '';

        // 1. Create or Update Firebase Auth Account
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(cleanEmail);
            // User exists: update password and displayName
            await auth.updateUser(userRecord.uid, {
                password: password,
                displayName: cleanName
            });
        } catch (authErr) {
            if (authErr.code === 'auth/user-not-found' || authErr.message?.includes('no user')) {
                // User does not exist yet: create new Auth user
                userRecord = await auth.createUser({
                    email: cleanEmail,
                    password: password,
                    displayName: cleanName
                });
            } else {
                throw authErr;
            }
        }

        // 2. Create or Update in Firestore 'users' collection with role: 'reporter'
        const userDocRef = db.collection('users').doc(userRecord.uid);
        const existingUserSnap = await userDocRef.get();
        const existingUserData = existingUserSnap.exists ? existingUserSnap.data() : {};

        const updatedUser = {
            id: userRecord.uid,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || existingUserData.phone || '',
            role: 'reporter',
            status: 'active',
            createdAt: existingUserData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await userDocRef.set(updatedUser, { merge: true });

        // 3. Set Custom Claim: role = 'reporter'
        try {
            await auth.setCustomUserClaims(userRecord.uid, { role: 'reporter' });
        } catch (claimErr) {
            console.warn('Could not set custom user claim:', claimErr.message);
        }

        // 4. Link back to reporter_applications document
        const linkPayload = {
            accountCreated: true,
            accountId: userRecord.uid,
            accountEmail: cleanEmail,
            tempPassword: password, // Track password so admin can view/copy directly from the card
            status: 'APPROVED',
            updatedAt: new Date().toISOString()
        };

        if (applicationId) {
            const cleanAppId = String(applicationId).trim();
            const appRef = db.collection('reporter_applications').doc(cleanAppId);
            const appSnap = await appRef.get();
            if (appSnap.exists) {
                await appRef.set(linkPayload, { merge: true });
            } else {
                // Lookup by inner id field
                const byId = await db.collection('reporter_applications').where('id', '==', cleanAppId).get();
                if (!byId.empty) {
                    await byId.docs[0].ref.set(linkPayload, { merge: true });
                }
            }
        } else {
            // Find application matching this email and link
            const matchApp = await db.collection('reporter_applications').where('email', '==', cleanEmail).get();
            if (!matchApp.empty) {
                for (const aDoc of matchApp.docs) {
                    await aDoc.ref.set(linkPayload, { merge: true });
                }
            }
        }

        // 5. Invalidate caches so 'All Reporters' and pending queues refresh immediately
        purgeCache('admin_reporters_with_stats');
        purgeCache('admin_pending');
        purgeCache('admin_stats');

        return NextResponse.json({
            success: true,
            message: 'Reporter account created/updated successfully',
            reporter: updatedUser,
            accountEmail: cleanEmail,
            tempPassword: password
        });

    } catch (error) {
        console.error('Error creating reporter account:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
