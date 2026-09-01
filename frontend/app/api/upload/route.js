import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ALLOWED_MIME_TYPES: Only these content types can be uploaded.
 * Validated server-side by checking file magic bytes, NOT the client-provided type.
 */
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // fix(P2-SEC-01): SVG removed — SVG can contain embedded JavaScript (XSS vector).
    // News portals do not require SVG uploads. Use PNG/WebP instead.
    'application/pdf',
];

/**
 * FILE_SIGNATURES: Magic byte signatures to validate actual file content.
 * The client-provided MIME type is NOT trusted.
 */
const FILE_SIGNATURES = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': null, // RIFF....WEBP — checked separately
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function detectMimeType(buffer) {
    if (buffer.length < 12) return null;

    // Check JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    // Check PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    // Check GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return 'image/gif';
    }
    // Check WebP (RIFF....WEBP)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
    }
    // Check PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return 'application/pdf';
    }
    // fix(P2-SEC-01): SVG detection removed — SVGs are no longer accepted.
    // SVG is text-based XML that can contain <script> tags (XSS risk when served inline).

    return null;
}

export async function POST(request) {
    const db = getDb();
    const auth = getAuth();

    if (!db) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // SECURITY: Require authentication for uploads
    if (!auth) {
        return NextResponse.json({ error: 'Auth service not available' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId;
    try {
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
    } catch (authError) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // SECURITY: Size limit (700KB, as before)
        if (buffer.length > 700 * 1024) {
            return NextResponse.json({
                error: 'File too large (max 700KB).',
            }, { status: 413 });
        }

        // SECURITY: Validate file content via magic bytes — do NOT trust client MIME type
        const detectedMime = detectMimeType(buffer);

        if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
            return NextResponse.json({
                error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.',
            }, { status: 415 });
        }

        const base64 = buffer.toString('base64');

        const docRef = await db.collection('file_uploads').add({
            filename: file.name,
            mimeType: detectedMime, // Use server-detected type, not client-provided
            data: base64,
            uploadedBy: userId,
            createdAt: new Date().toISOString()
        });

        const publicUrl = `/api/file/${docRef.id}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: file.name,
            type: detectedMime.startsWith('image/') ? 'image' : 'pdf'
        });

    } catch (error) {
        console.error('Upload error:', error.message);
        return NextResponse.json({
            error: 'Upload failed. Please try again.',
        }, { status: 500 });
    }
}
