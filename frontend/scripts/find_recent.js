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
        console.log('Querying for articles with author system-scraper-aajtak...');
        const snapshot = await db.collection('news_articles')
            .where('authorId', '==', 'system-scraper-aajtak')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('No recent articles found from scraper.');
            // Try different authorId or just recent
            const snap2 = await db.collection('news_articles')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
            console.log('Latest 5 articles in DB:');
            snap2.forEach(doc => {
                const data = doc.data();
                console.log(`- ID: ${doc.id} | TITLE: ${JSON.stringify(data.title)} | AUTH: ${data.authorId}`);
            });
            process.exit(0);
        }

        const doc = snapshot.docs[0];
        console.log('--- LATEST SCRAPED ARTICLE ---');
        console.log(JSON.stringify(doc.data(), null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        // It likely failed because of index. Re-run without order
        const snapshot = await db.collection('news_articles')
            .where('authorId', '==', 'system-scraper-aajtak')
            .limit(1)
            .get();
        if (!snapshot.empty) {
            console.log('--- LATEST SCRAPED ARTICLE (No order) ---');
            console.log(JSON.stringify(snapshot.docs[0].data(), null, 2));
        }
        process.exit(0);
    }
}
findRecent();
