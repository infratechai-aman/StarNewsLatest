import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { purgeCache } from '@/lib/cache';

// Whitelist of allowed fields for classified updates
const ALLOWED_CLASSIFIED_FIELDS = [
    'title', 'description', 'category', 'price', 'condition',
    'contactName', 'contactPhone', 'contactEmail', 'location',
    'images', 'image', 'approvalStatus', 'active', 'featured',
    'sellerName', 'whatsapp', 'phone', 'city', 'contact'
];

function sanitizeBody(body, allowedFields) {
    const sanitized = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            sanitized[field] = body[field];
        }
    }
    return sanitized;
}

// PUT: Update Classified (Admin)
export async function PUT(request, { params }) {
    const db = getDb();

    // Use centralized admin auth middleware
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const id = params.id;
        const body = await request.json();

        // Whitelist fields to prevent mass assignment
        const updateData = sanitizeBody(body, ALLOWED_CLASSIFIED_FIELDS);
        if (updateData.images && Array.isArray(updateData.images)) {
            updateData.images = updateData.images.filter(Boolean);
            if (!updateData.image && updateData.images.length > 0) {
                updateData.image = updateData.images[0];
            }
        } else if (updateData.image && (!updateData.images || !updateData.images.length)) {
            updateData.images = [updateData.image];
        }
        updateData.updatedAt = new Date().toISOString();

        await db.collection('classified_ads').doc(id).update(updateData);
        purgeCache('admin_classifieds_list'); // Invalidate admin list cache
        purgeCache('classifieds'); // Invalidate public list cache

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating classified:', error.message);
        return NextResponse.json({ error: 'Failed to update classified' }, { status: 500 });
    }
}

// DELETE: Delete Classified
export async function DELETE(request, { params }) {
    const db = getDb();

    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const id = params.id;
        await db.collection('classified_ads').doc(id).delete();
        purgeCache('admin_classifieds_list'); // Invalidate admin list cache
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting classified:', error.message);
        return NextResponse.json({ error: 'Failed to delete classified' }, { status: 500 });
    }
}
