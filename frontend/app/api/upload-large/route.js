import { getAuth, getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { uploadLimiter } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * LARGE FILE UPLOAD ROUTE
 * For files that exceed Firestore's 1MB document limit (e.g., PDFs for E-Newspaper).
 * Saves files to public/uploads/ directory instead of Firestore base64.
 * 
 * SECURITY: Requires reporter or admin role.
 * NOTE: On Vercel, the public/ directory is read-only after deployment.
 * For production, this should migrate to Firebase Storage or Vercel Blob.
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

    // VERCEL GUARD: The public/ directory is read-only after deployment on Vercel.
    // File writes will silently fail or throw. Return a clear error instead.
    if (process.env.VERCEL) {
        return NextResponse.json({
            error: 'Local file storage is not supported on Vercel. Please configure Firebase Storage or Vercel Blob for file uploads in production.',
        }, { status: 501 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success } = uploadLimiter.check(ip);
    if (!success) {
        return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Size limit
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

        // Generate unique filename
        const ext = ALLOWED_TYPES[detectedMime];
        const uniqueId = crypto.randomUUID();
        const filename = `${uniqueId}.${ext}`;

        // Determine subdirectory based on file type
        const subDir = detectedMime === 'application/pdf' ? 'enewspapers' : 'images';
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Write file to disk
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return public URL (served statically by Next.js from /public)
        const publicUrl = `/uploads/${subDir}/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: file.name,
            type: detectedMime === 'application/pdf' ? 'pdf' : 'image',
            size: buffer.length,
        });

    } catch (error) {
        console.error('Large file upload error:', error.message);
        return NextResponse.json({
            error: 'Upload failed. Please try again.',
        }, { status: 500 });
    }
}
