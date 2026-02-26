const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'frontend', '.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey
        })
    });
}

const auth = admin.auth();
const db = admin.firestore();

const USERS_TO_CREATE = [
    {
        email: 'riyaz@starnews.com',
        password: 'Macbook@StarNews',
        displayName: 'StarNews Admin',
        uid: 'dc51d99a-58bc-4219-b8cd-0bf75660b4c1', // Match Firestore ID
        role: 'super_admin'
    },
    {
        email: 'aman@reporterStarNews',
        password: 'StarNews@123',
        displayName: 'Aman Reporter',
        uid: 'f902dd1c-ada6-4bef-b1e2-6275f106823b', // Match Firestore ID
        role: 'reporter'
    },
    {
        email: 'aman@starnewsreporter.com',
        password: 'StarNews@123',
        displayName: 'Aman Thalukdar',
        uid: '54f30c77-333e-4507-a774-e7ac56e91658', // Match Firestore ID
        role: 'reporter'
    }
];

async function createUsers() {
    console.log('--- Creating/Syncing Users to Firebase Auth ---');
    for (const u of USERS_TO_CREATE) {
        try {
            await auth.createUser({
                uid: u.uid,
                email: u.email,
                password: u.password,
                displayName: u.displayName
            });
            console.log(`✅ Created user: ${u.email}`);
        } catch (e) {
            if (e.code === 'auth/uid-already-exists' || e.code === 'auth/email-already-exists') {
                console.log(`ℹ️ User already exists: ${u.email}. Updating password...`);
                // Get UID if email exists but UID doesn't match? Unlikely if we use our list
                const user = await auth.getUserByEmail(u.email);
                await auth.updateUser(user.uid, {
                    password: u.password
                });
                console.log(`✅ Updated password for: ${u.email}`);
            } else {
                console.error(`❌ Failed to create ${u.email}:`, e.message);
            }
        }

        // Ensure Firestore role is set correctly
        await db.collection('users').doc(u.uid).set({
            email: u.email,
            name: u.displayName,
            role: u.role,
            status: 'active',
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`✅ Synced role for: ${u.email}`);
    }
}

createUsers().then(() => {
    console.log('Done.');
    process.exit(0);
}).catch(console.error);
