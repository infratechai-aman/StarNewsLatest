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

        // Images are auto-compressed client-side to ≤500KB
        // Firestore doc limit is 1MB, base64 adds ~33% overhead
        // So 500KB image → ~680KB base64 → safely under 1MB
        if (buffer.length > 700 * 1024) {
            return NextResponse.json({
                error: 'Image too large (max 700KB). The auto-compressor should handle this — try refreshing the page.',
            }, { status: 413 });
        }

        const base64 = buffer.toString('base64');
        const mimeType = file.type;

        const docRef = await db.collection('file_uploads').add({
            filename: file.name,
            mimeType: mimeType,
            data: base64,
            createdAt: new Date().toISOString()
        });

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
