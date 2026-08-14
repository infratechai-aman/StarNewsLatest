const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin (mimicking lib/firebaseAdmin.js)
if (!getApps().length) {
    let serviceAccount;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        }
    } catch (e) {
        console.error('Error parsing service account key');
        process.exit(1);
    }
    
    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        console.error('No service account key found in .env.local');
        process.exit(1);
    }
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
