const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'frontend', '.env.local') });

// Extract credentials from env
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase credentials in .env.local");
    process.exit(1);
}

const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
    })
});

const db = getFirestore();
const auth = getAuth();

async function listUsers() {
    console.log('Listing users...');
    try {
        const listUsersResult = await auth.listUsers(100);
        console.log(`Found ${listUsersResult.users.length} users in Auth:`);

        for (const userRecord of listUsersResult.users) {
            // Check if they have a role in Firestore 'users' collection
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            let role = 'N/A';
            if (userDoc.exists) {
                role = userDoc.data().role || 'public';
            }

            // Also check custom claims
            const claims = userRecord.customClaims || {};

            if (role !== 'public' || Object.keys(claims).length > 0) {
                console.log(`- Email: ${userRecord.email} | UID: ${userRecord.uid} | Role (DB): ${role} | Claims: ${JSON.stringify(claims)}`);
            }
        }
    } catch (error) {
        console.log('Error listing users:', error);
    }
}

listUsers().then(() => {
    process.exit(0);
});
