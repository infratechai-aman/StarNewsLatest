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
    const usersSnap = await db.collection('users').get();
    const users = [];
    usersSnap.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
    });
    console.log(JSON.stringify(users));
}

checkUsers().catch(console.error);
