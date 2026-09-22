import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// POST: Approve, Reject, or Ban a User (Admin only)
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { userId, action } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
        }

        const validActions = ['approve', 'reject', 'ban'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: `Invalid action "${action}". Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        const docRef = db.collection('users').doc(userId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = doc.data();
        const statusMap = { approve: 'active', reject: 'rejected', ban: 'banned' };
        const newStatus = statusMap[action];

        const updateData = {
            status: newStatus,
            updatedAt: new Date().toISOString()
        };

        if (action === 'approve') {
            if (!userData.role || userData.role === 'registered') {
                updateData.role = 'reporter';
            }
        }

        await docRef.update(updateData);
        const finalRole = updateData.role || userData.role || 'reporter';

        // Set Firebase Auth custom claims
        if (auth && action === 'approve') {
            try {
                await auth.setCustomUserClaims(userId, { role: finalRole });
            } catch (err) {
                console.warn('Could not set custom user claims on approved user:', err.message);
            }
        }

        // Also sync any matching reporter_applications
        if (userData.email) {
            try {
                const emailNorm = userData.email.toLowerCase().trim();
                const appSnaps = await db.collection('reporter_applications')
                    .where('email', '==', emailNorm)
                    .get();

                for (const appDoc of appSnaps.docs) {
                    await appDoc.ref.update({
                        status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : appDoc.data().status,
                        updatedAt: new Date().toISOString()
                    });
                }
            } catch (e) {
                console.warn('Could not sync reporter applications:', e.message);
            }
        }

        purgeCache('admin_pending');
        purgeCache('admin_reporters_with_stats');
        purgeCache('admin_stats');

        return NextResponse.json({ success: true, userId, status: newStatus, role: finalRole });
    } catch (error) {
        console.error('Error approving/banning user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

