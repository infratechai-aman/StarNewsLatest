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

async function findRecent() {
    try {
        console.log('--- SEARCHING FOR RECENTLY APPROVED ARTICLES ---');
        // This query matches what the API is supposed to do
        const snapshot = await db.collection('news_articles')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true)
            .orderBy('publishedAt', 'desc')
            .limit(5)
            .get();

        console.log(`Found ${snapshot.size} articles.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`  Title: ${data.title?.en || data.title?.hi || data.title}`);
            console.log(`  PublishedAt: ${data.publishedAt}`);
            console.log(`  CreatedAt: ${data.createdAt}`);
            console.log(`  Featured: ${data.featured}`);
            console.log('---');
        });

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
findRecent();
