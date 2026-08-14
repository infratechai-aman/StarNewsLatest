import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// PUT: Approve E-Newspaper
export async function PUT(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        await db.collection('enewspapers').doc(id).update({
            approvalStatus: 'approved',
            active: true,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, status: 'approved' });
    } catch (error) {
        console.error('Error approving enewspaper:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
