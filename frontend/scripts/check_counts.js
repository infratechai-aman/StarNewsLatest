const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

async function check() {
    try {
        const snapshot = await db.collection('news_articles').get();
        console.log('Firestore Articles Count:', snapshot.size);

        // Check for recent ones
        const recent = await db.collection('news_articles').orderBy('createdAt', 'desc').limit(5).get();
        recent.forEach(doc => {
            const data = doc.data();
            console.log(`- ${data.slug} (${data.createdAt})`);
        });

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

check();
