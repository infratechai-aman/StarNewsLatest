const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function verify() {
    console.log('Verifying Firebase Connection...');

    if (!process.env.FIREBASE_PROJECT_ID) {
        console.error('ERROR: FIREBASE_PROJECT_ID is missing in .env.local');
        process.exit(1);
    }

    try {
        const app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });

        const db = getFirestore(app);
        console.log('Firebase Admin Initialized.');

        // Test Read
        console.log('Testing Read (site_settings)...');
        const settingsSnap = await db.collection('site_settings').get();
        console.log(`Read success. Found ${settingsSnap.size} settings documents.`);

        // Test Write
        console.log('Testing Write (verification_test)...');
        await db.collection('verification_test').doc('test').set({
            timestamp: new Date().toISOString(),
            status: 'working'
        });
        console.log('Write success.');

        // Clean up
        await db.collection('verification_test').doc('test').delete();
        console.log('Cleanup success.');

        console.log('ALL CHECKS PASSED. Firebase is ready.');

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
    }
}

verify();
