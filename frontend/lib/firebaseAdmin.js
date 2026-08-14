import * as admin from 'firebase-admin';

// NOTE: dotenv is NOT needed here — Next.js automatically loads .env.local

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

    // Next.js automatically loads .env.local — no manual dotenv needed

    let projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // Support cases where the entire Service Account JSON is pasted into FIREBASE_PRIVATE_KEY
    if (rawKey && rawKey.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(rawKey);
            rawKey = parsed.private_key || rawKey;
            clientEmail = clientEmail || parsed.client_email;
            projectId = projectId || parsed.project_id;
            console.log('[FirebaseAdmin] Successfully extracted credentials from JSON string');
        } catch (e) {
            console.warn('[FirebaseAdmin] FIREBASE_PRIVATE_KEY looks like JSON but failed to parse');
        }
    }

    if (!projectId) {
        console.error(`[FirebaseAdmin] Missing Project ID entirely. Cannot initialize.`);
        return null;
    }

    if (!clientEmail || !rawKey) {
        console.warn(`[FirebaseAdmin] Missing private key/email on Vercel. Initializing in Public/Unauthenticated mode.`);
        try {
            return admin.initializeApp({
                projectId,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
            });
        } catch (err) {
            console.error('[FirebaseAdmin] Fallback unauthenticated init failed:', err.message);
            return null;
        }
    }

    try {
        const privateKey = cleanPrivateKey(rawKey);

        // Diagnostic logging (no sensitive values)
        console.log(`[FirebaseAdmin] Init: project=${projectId}, keyLen=${privateKey.length}`);

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

// NOTE: Do NOT export module-level `db` or `auth` constants.
// They would be evaluated once at import time and could permanently be null
// if Firebase hasn't initialized yet. Always use getDb() / getAuth() instead.
