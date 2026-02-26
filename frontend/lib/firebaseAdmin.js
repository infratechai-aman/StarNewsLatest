import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

/** 
 * Extremely Robust Firebase Admin Initialization
 * Handles sensitive private key parsing for various environments
 */

const cleanPrivateKey = (key) => {
    if (!key) return null;

    let cleaned = key.replace(/^['"](.*)['"]$/, '$1');

    const beginMarker = '-----BEGIN PRIVATE KEY-----';
    const endMarker = '-----END PRIVATE KEY-----';

    if (cleaned.includes(beginMarker) && cleaned.includes(endMarker)) {
        // Extract the raw base64 payload between the markers
        let base64 = cleaned.substring(
            cleaned.indexOf(beginMarker) + beginMarker.length,
            cleaned.indexOf(endMarker)
        );

        // Obliterate ANY whitespaces, literal \n strings, or junk
        base64 = base64.replace(/\\n/g, ''); // literal \n
        base64 = base64.replace(/\s+/g, ''); // spaces, tabs, real newlines

        // Reconstruct exactly into 64-character lines as required by Node/OpenSSL
        const lines = base64.match(/.{1,64}/g) || [];
        cleaned = `${beginMarker}\n${lines.join('\n')}\n${endMarker}\n`;
    } else {
        // Fallback if markers are completely missing (unlikely, but safe)
        cleaned = cleaned.replace(/\\n/g, '\n');
    }

    return cleaned;
};

const getApp = () => {
    if (admin.apps.length > 0) return admin.apps[0];

    // Load .env.local from multiple possible root-relative locations
    const possiblePaths = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), 'frontend', '.env.local'),
        path.join(__dirname, '..', '.env.local'),
        path.join(__dirname, '..', '..', '.env.local'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            dotenv.config({ path: p });
            break;
        }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
        console.error(`[FirebaseAdmin] Missing credentials. PID:${!!projectId} EMAIL:${!!clientEmail} KEY:${!!rawKey}`);
        return null;
    }

    try {
        const privateKey = cleanPrivateKey(rawKey);

        // Diagnostic logging for terminal troubleshooting (no values shown)
        console.log('[FirebaseAdmin] Attempting Init...');
        console.log(`- Project ID: ${projectId}`);
        console.log(`- Private Key Length: ${privateKey.length}`);
        console.log(`- Key starts with header: ${privateKey.trim().startsWith('-----BEGIN PRIVATE KEY-----')}`);

        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
    } catch (error) {
        console.error('[FirebaseAdmin] Initialization Failed:', error.message);
        if (error.message.includes('DECODER')) {
            console.error('[FirebaseAdmin] HINT: Your FIREBASE_PRIVATE_KEY format is likely invalid. Ensure it includes \\n and is wrapped in quotes in .env.local');
        }
        return null;
    }
};

export const getDb = () => {
    const app = getApp();
    return app ? admin.firestore() : null;
};

export const getAuth = () => {
    const app = getApp();
    return app ? admin.auth() : null;
};

export const getStorage = () => {
    const app = getApp();
    return app ? admin.storage() : null;
};

// Lazy exports for backward compatibility
export const db = getDb();
export const auth = getAuth();
