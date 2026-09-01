import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Approve, Reject, or Ban a User (Admin only)
// fix(P3-BE-01): Extended to support 'approve', 'reject', and 'ban' actions.
// Previously only mapped 'approve' -> 'active' and everything else -> 'inactive',
// which meant there was no way to distinguish a banned user from a rejected one.
// Also uncommented error logging (P2-BE-02 pattern).
export async function POST(request) {
    const db = getDb();
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

        const statusMap = { approve: 'active', reject: 'rejected', ban: 'banned' };
        const newStatus = statusMap[action];

        await docRef.update({
            status: newStatus,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, userId, status: newStatus });
    } catch (error) {
        console.error('Error approving/banning user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
