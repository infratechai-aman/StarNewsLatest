const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const admin = require('firebase-admin');

console.log('--- Diagnostic Start ---');
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
if (process.env.FIREBASE_PRIVATE_KEY) {
    console.log('PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY.length);
    console.log('PRIVATE_KEY starts with quote:', process.env.FIREBASE_PRIVATE_KEY.startsWith('"'));
    console.log('PRIVATE_KEY ends with quote:', process.env.FIREBASE_PRIVATE_KEY.endsWith('"'));
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
    try {
        const sanitizedKey = privateKey
            .replace(/^"(.*)"$/, '$1')
            .replace(/\\n/g, '\n');

        console.log('Sanitized key length:', sanitizedKey.length);
        console.log('Sanitized key contains literal newline:', sanitizedKey.includes('\n'));

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: sanitizedKey,
            })
        });
        console.log('✅ Firebase Admin initialized successfully in diagnostic');

        const db = admin.firestore();
        console.log('✅ Firestore instance obtained');

    } catch (error) {
        console.error('❌ Diagnostic initialization error:', error.message);
    }
} else {
    console.warn('❌ Missing environment variables in diagnostic');
}
console.log('--- Diagnostic End ---');
