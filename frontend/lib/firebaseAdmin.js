import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

/** 
 * Extremely Robust Firebase Admin Initialization
 */

const getApp = () => {
    if (admin.apps.length > 0) return admin.apps[0];

    // Attempt to load .env.local from multiple possible locations
    const possiblePaths = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), 'frontend', '.env.local'),
        path.join(__dirname, '..', '.env.local'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            dotenv.config({ path: p });
            // console.log(`[FirebaseAdmin] Loaded env from: ${p}`);
            break;
        }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        // console.error('[FirebaseAdmin] Missing credentials after path search');
        return null;
    }

    try {
        const sanitizedKey = privateKey
            .replace(/^"(.*)"$/, '$1')
            .replace(/\\n/g, '\n');

        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: sanitizedKey,
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
    } catch (error) {
        // console.error('[FirebaseAdmin] Init Failed:', error.message);
        return null;
    }
};

export const getDb = () => {
    const app = getApp();
    const db = app ? admin.firestore() : null;
    return db;
};

export const getAuth = () => {
    const app = getApp();
    return app ? admin.auth() : null;
};

// Lazy exports for initial load
export const db = getDb();
export const auth = getAuth();
