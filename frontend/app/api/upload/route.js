import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    const db = getDb();

    if (!db) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = file.type;

        // Store in Firestore "file_uploads" collection
        const docRef = await db.collection('file_uploads').add({
            filename: file.name,
            mimeType: mimeType,
            data: base64,
            createdAt: new Date().toISOString()
        });

        // Return the new "DB URL" served by our own API
        const publicUrl = `/api/file/${docRef.id}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: file.name,
            type: mimeType.startsWith('image/') ? 'image' : 'pdf'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Upload failed: ' + error.message,
        }, { status: 500 });
    }
}

