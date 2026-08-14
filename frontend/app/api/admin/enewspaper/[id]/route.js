import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';


// DELETE: Delete E-Newspaper
export async function DELETE(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        await db.collection('enewspapers').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting enewspaper:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
