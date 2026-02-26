import { getDb, getStorage } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    const storage = getStorage();
    const db = getDb();

    if (!storage || !db) {
        // Fallback: if storage isn't available, try the old Firestore method for small files
        return handleFirestoreFallback(request, db);
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;
        const ext = file.name.split('.').pop() || 'bin';
        const uniqueName = `uploads/${crypto.randomUUID()}.${ext}`;

        // Upload to Firebase Cloud Storage
        const bucket = storage.bucket();
        const fileRef = bucket.file(uniqueName);

        await fileRef.save(buffer, {
            metadata: {
                contentType: mimeType,
                metadata: {
                    originalName: file.name,
                    uploadedAt: new Date().toISOString()
                }
            }
        });

        // Make the file publicly accessible
        await fileRef.makePublic();

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: file.name,
            type: mimeType.startsWith('image/') ? 'image' : 'pdf'
        });

    } catch (error) {
        console.error('Upload error:', error);

        // If Cloud Storage fails (e.g., permissions), fall back to Firestore for small files
        if (error.code === 403 || error.code === 401 || error.message?.includes('permission') || error.message?.includes('does not have storage')) {
            console.warn('Cloud Storage unavailable, falling back to Firestore...');
            return handleFirestoreFallback(request, db);
        }

        return NextResponse.json({
            error: 'Upload failed: ' + error.message,
        }, { status: 500 });
    }
}

// Fallback: store in Firestore (only works for files < ~750KB due to 1MB document limit)
async function handleFirestoreFallback(request, db) {
    if (!db) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    try {
        let formData;
        try {
            formData = await request.formData();
        } catch (e) {
            // formData was already consumed by the primary handler
            return NextResponse.json({
                error: 'Image too large for current storage. Maximum ~750KB. Please use a smaller image or provide an image URL instead.',
            }, { status: 413 });
        }

        const file = formData.get('file');
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Check size — Firestore has 1MB document limit, base64 adds ~33% overhead
        if (buffer.length > 750 * 1024) {
            return NextResponse.json({
                error: 'Image too large for current storage. Maximum ~750KB. Please use a smaller image or provide an image URL instead.',
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
        console.error('Firestore fallback upload error:', error);
        return NextResponse.json({
            error: 'Upload failed: ' + error.message,
        }, { status: 500 });
    }
}
