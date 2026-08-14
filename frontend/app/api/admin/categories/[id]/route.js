import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/cache';

// PUT: Update Category (Admin)
export async function PUT(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;
        const body = await request.json();

        const updateData = { ...body, updatedAt: new Date().toISOString() };
        delete updateData.id;
        delete updateData.createdAt;

        await db.collection('news_categories').doc(id).update(updateData);

        // Invalidate public categories cache
        invalidateCache('categories_all');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete Category (Admin) — soft-delete by setting active=false
export async function DELETE(request, { params }) {
    const db = getDb();
    try {
        const authResult = await requireSuperAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const id = params.id;

        // Soft-delete: set active to false so existing articles aren't orphaned
        await db.collection('news_categories').doc(id).update({
            active: false,
            updatedAt: new Date().toISOString()
        });

        // Invalidate public categories cache
        invalidateCache('categories_all');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
