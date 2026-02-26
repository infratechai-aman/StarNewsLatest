const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'frontend', '.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
    })
});

const db = admin.firestore();

async function checkUsers() {
    console.log('--- Checking Users Collection ---');
    const usersSnap = await db.collection('users').get();
    console.log(`Total users in Firestore: ${usersSnap.size}`);
    usersSnap.forEach(doc => {
        console.log(`User: ${doc.id} => ${JSON.stringify(doc.data())}`);
    });
}

checkUsers().catch(console.error);
