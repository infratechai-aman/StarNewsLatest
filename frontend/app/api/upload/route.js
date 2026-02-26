import { db } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const fileExtension = file.name.split('.').pop();
        const mimeType = file.type;

        // Store in Firestore "file_uploads" collection
        // Note: Firestore has 1MB limit. This is risky for large files but same risk as Vercel functions generally.
        // For production, Real Storage is better, but this bridges the migration.

        const docRef = await db.collection('file_uploads').add({
            filename: file.name,
            mimeType: mimeType,
            data: base64, // Storing as base64 string
            createdAt: new Date().toISOString()
        });

        // Return the new "DB URL" served by our own API
        // This keeps compatibility with existing frontend that expects /api/file/{id}
        const publicUrl = `/api/file/${docRef.id}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: file.name,
            type: mimeType.startsWith('image/') ? 'image' : 'pdf'
        });

    } catch (error) {
        // console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Upload failed: ' + error.message,
        }, { status: 500 });
    }
}
