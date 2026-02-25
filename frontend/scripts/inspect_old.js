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

async function inspectOld() {
    try {
        const snapshot = await db.collection('news_articles')
            .where('authorId', '!=', 'system-scraper-aajtak')
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('No old articles found.');
            process.exit(0);
        }

        console.log(JSON.stringify(snapshot.docs[0].data(), null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
inspectOld();
