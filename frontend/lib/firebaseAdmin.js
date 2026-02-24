import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        try {
            // Sanitize private key: handle double-escaped newlines and potential wrapping quotes from .env
            const sanitizedKey = privateKey
                .replace(/^"(.*)"$/, '$1') // Remove wrapping quotes if present
                .replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    privateKey: sanitizedKey,
                }),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
            console.log('Firebase admin initialized successfully for project:', projectId);
        } catch (error) {
            console.error('Firebase admin initialization error:', error.message);
        }
    } else {
        const missing = [];
        if (!projectId) missing.push('FIREBASE_PROJECT_ID');
        if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
        console.warn('Firebase admin environment variables are missing:', missing.join(', '), '. Skipping initialization.');
    }
}

export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
export const storage = admin.apps.length ? admin.storage() : null;
