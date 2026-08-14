import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Whitelist of allowed fields for classified updates
const ALLOWED_CLASSIFIED_FIELDS = [
    'title', 'description', 'category', 'price', 'condition',
    'contactName', 'contactPhone', 'contactEmail', 'location',
    'images', 'approvalStatus', 'active', 'featured',
    'sellerName', 'whatsapp', 'phone'
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
        updateData.updatedAt = new Date().toISOString();

        await db.collection('classified_ads').doc(id).update(updateData);

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
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting classified:', error.message);
        return NextResponse.json({ error: 'Failed to delete classified' }, { status: 500 });
    }
}
