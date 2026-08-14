import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// PUT: Reject E-Newspaper
export async function PUT(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        const body = await request.json().catch(() => ({}));

        await db.collection('enewspapers').doc(id).update({
            approvalStatus: 'rejected',
            active: false,
            rejectionReason: body.reason || '',
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, status: 'rejected' });
    } catch (error) {
        console.error('Error rejecting enewspaper:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
