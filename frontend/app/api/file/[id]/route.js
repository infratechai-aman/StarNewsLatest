import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const db = getDb();
    const auth = getAuth();

    if (!db) {
        return new NextResponse('Database not available', { status: 503 });
    }

    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id || params?.id;
        if (!id) {
            return new NextResponse('Missing ID', { status: 400 });
        }

        const doc = await db.collection('file_uploads').doc(id).get();

        if (!doc.exists) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileData = doc.data();

        // If explicitly restricted, verify auth token
        if (fileData.restricted === true) {
            const authHeader = request.headers.get('authorization');
            const token = authHeader?.replace('Bearer ', '');
            if (!token || !auth) {
                return new NextResponse('Authentication required', { status: 401 });
            }
            try {
                await auth.verifyIdToken(token);
            } catch {
                return new NextResponse('Invalid or expired token', { status: 401 });
            }
        }

        let buffer;
        if (fileData.isChunked) {
            const chunksSnap = await db.collection('file_uploads').doc(id).collection('chunks').orderBy('index', 'asc').get();
            const buffers = chunksSnap.docs.map(c => Buffer.from(c.data().data, 'base64'));
            buffer = Buffer.concat(buffers);
        } else if (fileData.data) {
            buffer = Buffer.from(fileData.data, 'base64');
        } else {
            return new NextResponse('File content empty', { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', fileData.mimeType || 'application/octet-stream');
        headers.set('Content-Disposition', `inline; filename="${fileData.filename}"`);
        headers.set('Content-Length', String(buffer.length));
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
