import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { uploadLimiter } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * LARGE FILE UPLOAD ROUTE
 * Supports large files (e.g. multi-page PDFs for E-Newspaper, high-res images) up to 25MB.
 * Uses persistent chunked Firestore storage to work 100% reliably on Vercel and local environments.
 * Files are split into chunks safely under Firestore's 1MB document limit and served seamlessly via /api/file/[id].
 */

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_TYPES = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
};

function detectMimeType(buffer) {
    if (buffer.length < 12) return null;
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
    return null;
}

export async function POST(request) {
    // SECURITY: Require reporter or admin role for uploads
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Rate limiting: max 10 uploads per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success } = uploadLimiter.check(ip);
    if (!success) {
        return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
    }

    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database service not available' }, { status: 503 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Size limit check
        if (buffer.length > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB).`,
            }, { status: 413 });
        }

        // Validate file type via magic bytes
        const detectedMime = detectMimeType(buffer);
        if (!detectedMime || !ALLOWED_TYPES[detectedMime]) {
            return NextResponse.json({
                error: 'Invalid file type. Only images and PDFs are allowed.',
            }, { status: 415 });
        }

        const userId = authResult.user?.userId || 'admin';

        // If file fits within a single Firestore document (< 700KB)
        if (buffer.length <= 700 * 1024) {
            const docRef = await db.collection('file_uploads').add({
                filename: file.name,
                mimeType: detectedMime,
                data: buffer.toString('base64'),
                isChunked: false,
                uploadedBy: userId,
                size: buffer.length,
                createdAt: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                url: `/api/file/${docRef.id}`,
                filename: file.name,
                type: detectedMime === 'application/pdf' ? 'pdf' : 'image',
                size: buffer.length,
            });
        }

        // Persistent Chunked Firestore storage for larger files (e.g., multi-page PDFs)
        // 450KB chunk size results in ~600KB base64 per doc, safely under Firestore 1MB doc limit
        const CHUNK_SIZE = 450 * 1024;
        const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);

        const docRef = await db.collection('file_uploads').add({
            filename: file.name,
            mimeType: detectedMime,
            isChunked: true,
            totalChunks,
            uploadedBy: userId,
            size: buffer.length,
            createdAt: new Date().toISOString()
        });

        // Store chunks in batches of up to 20 to ensure fast commit
        for (let i = 0; i < totalChunks; i += 20) {
            const batch = db.batch();
            const chunkBatchEnd = Math.min(i + 20, totalChunks);
            for (let j = i; j < chunkBatchEnd; j++) {
                const chunkBuffer = buffer.subarray(j * CHUNK_SIZE, Math.min((j + 1) * CHUNK_SIZE, buffer.length));
                const chunkRef = db.collection('file_uploads').doc(docRef.id).collection('chunks').doc(String(j));
                batch.set(chunkRef, {
                    index: j,
                    data: chunkBuffer.toString('base64')
                });
            }
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            url: `/api/file/${docRef.id}`,
            filename: file.name,
            type: detectedMime === 'application/pdf' ? 'pdf' : 'image',
            size: buffer.length,
        });

    } catch (error) {
        console.error('Large file upload error:', error);
        return NextResponse.json({
            error: 'Upload failed: ' + (error.message || 'Please try again.'),
        }, { status: 500 });
    }
}
