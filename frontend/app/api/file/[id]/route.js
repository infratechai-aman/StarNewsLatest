import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const db = getDb();

    if (!db) {
        return new NextResponse('Database not available', { status: 503 });
    }

    try {
        const id = params.id;
        if (!id) {
            return new NextResponse('Missing ID', { status: 400 });
        }

        const doc = await db.collection('file_uploads').doc(id).get();

        if (!doc.exists) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileData = doc.data();
        const base64Data = fileData.data;
        const buffer = Buffer.from(base64Data, 'base64');

        const headers = new Headers();
        headers.set('Content-Type', fileData.mimeType || 'application/octet-stream');
        headers.set('Content-Disposition', `inline; filename="${fileData.filename}"`);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(buffer, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('File serve error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

