const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin (mimicking lib/firebaseAdmin.js)
// Initialize Firebase Admin
// fix(P1-AUTH-01): Read individual env vars matching .env.local structure
// instead of FIREBASE_SERVICE_ACCOUNT_KEY (JSON blob) which was never defined.
if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing required env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        process.exit(1);
    }

    // Normalize private key: replace literal \n with real newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    initializeApp({
        credential: cert({ projectId, clientEmail, privateKey })
    });
}

const auth = getAuth();
const db = getFirestore();

async function createLocalAdmin() {
    const email = 'admin@starnews.local';
    const password = 'password123';
    
    try {
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log('User already exists, updating password...');
            await auth.updateUser(userRecord.uid, { password });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('Creating new admin user...');
                userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: 'Local Super Admin',
                });
            } else {
                throw error;
            }
        }

        // Elevate to super_admin in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            id: userRecord.uid,
            email: email,
            name: 'Local Super Admin',
            role: 'super_admin',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log('\n✅ Admin Account Created/Updated Successfully!');
        console.log('----------------------------------------');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('----------------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createLocalAdmin();
